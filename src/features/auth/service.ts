import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { getSiteUrl } from "@/lib/env";
import { getLoyaltySettings, awardPoints } from "@/lib/loyalty";

export const SignupSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
});

export const LoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

export async function signupUser(input: SignupInput, referralCode?: string) {
  const parsed = SignupSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid input",
      400
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/`,
    },
  });

  if (error) {
    // TEMP: expose real error for debugging
    logger.warn({ code: error.code, message: error.message }, "Signup failed");
    if (error.code === "user_already_exists") {
      throw new AppError("CONFLICT", "An account with this email already exists.", 409);
    }
    // Return real Supabase error message so we can diagnose
    throw new AppError("INTERNAL_ERROR", `Supabase: ${error.message} (code: ${error.code ?? "none"})`, 500);
  }

  if (!data.user) {
    throw new AppError("INTERNAL_ERROR", "Signup failed: Supabase returned no user and no error.", 500);
  }

  let prismaUser = await prisma.user.findUnique({
    where: { supabaseId: data.user.id },
  });

  if (!prismaUser) {
    prismaUser = await prisma.user.create({
      data: {
        supabaseId: data.user.id,
        email: parsed.data.email.toLowerCase(),
        role: "USER",
      },
    });
  }

  // Sync role to Supabase user_metadata
  if (prismaUser) {
    try {
      const adminSupabase = createSupabaseAdminClient();
      await adminSupabase.auth.admin.updateUserById(data.user.id, {
        user_metadata: { role: prismaUser.role },
      });
    } catch (syncErr) {
      logger.warn({ userId: data.user.id, error: syncErr }, "Failed to sync role to Supabase metadata during signup");
    }
  }

  // Auto-login after signup
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (loginError) {
    logger.warn({ code: loginError.code, message: loginError.message }, "Auto-login after signup failed");
  }

  // B12: Link referral if a valid code was provided
  if (referralCode && prismaUser) {
    try {
      const refCodeRow = await prisma.referralCode.findUnique({
        where: { code: referralCode.toUpperCase() },
      });
      if (refCodeRow && refCodeRow.userId !== prismaUser.id) {
        // Only create if not already referred (unique constraint on referredUserId)
        const existing = await prisma.referralUse.findUnique({
          where: { referredUserId: prismaUser.id },
        });
        if (!existing) {
          const settings = await getLoyaltySettings();
          await prisma.referralUse.create({
            data: {
              referralCodeId: refCodeRow.id,
              referredUserId: prismaUser.id,
              pointsAwarded: settings.referralBonus,
            },
          });
          // Award points immediately to the referrer
          await awardPoints(
            refCodeRow.userId,
            settings.referralBonus,
            `Referral bonus — referred friend ${prismaUser.email} signed up`
          );
        }
      }
    } catch (refErr) {
      logger.warn({ referralCode, error: refErr }, "Failed to record referral during signup");
    }
  }

  return prismaUser;
}

export async function loginUser(input: LoginInput) {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid input",
      400
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    // Log internally for debugging/troubleshooting, retaining full details
    logger.warn({ code: error?.code, message: error?.message }, "Login failed");
    
    if (error?.code === "email_not_confirmed" || error?.message?.toLowerCase().includes("email not confirmed")) {
      throw new AppError(
        "EMAIL_NOT_CONFIRMED",
        "Your email address is not verified. Please check your inbox or resend the verification link.",
        401
      );
    }

    throw new AppError(
      "UNAUTHORIZED",
      `Login failed: ${error?.message ?? "unknown"} (code: ${error?.code ?? "none"})`,
      401
    );
  }

  let prismaUser = await prisma.user.findUnique({
    where: { supabaseId: data.user.id },
  });

  if (!prismaUser) {
    prismaUser = await prisma.user.create({
      data: {
        supabaseId: data.user.id,
        email: data.user.email!.toLowerCase(),
        role: "USER",
      },
    });
  }

  // Sync role to Supabase user_metadata
  if (prismaUser) {
    try {
      const adminSupabase = createSupabaseAdminClient();
      await adminSupabase.auth.admin.updateUserById(data.user.id, {
        user_metadata: { role: prismaUser.role },
      });
    } catch (syncErr) {
      logger.warn({ userId: data.user.id, error: syncErr }, "Failed to sync role to Supabase metadata during login");
    }
  }

  return prismaUser;
}

export async function logoutUser() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
