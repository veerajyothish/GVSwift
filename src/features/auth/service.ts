import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { getSiteUrl } from "@/lib/env";
import { isPasswordLeaked } from "@/lib/auth/checkLeakedPassword";
import { getLoyaltySettings, awardPoints } from "@/lib/loyalty";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/emails/welcome";

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

/** Derives a friendly first name from an email prefix. */
function firstNameFromEmail(email: string): string {
  const prefix = email.split('@')[0] ?? 'there';
  // Strip digits/dots/underscores, capitalise first letter
  const cleaned = prefix.replace(/[0-9._-]+/g, ' ').trim().split(' ')[0] ?? 'there';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

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

  if (await isPasswordLeaked(parsed.data.password)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "This password has appeared in a known data breach. Please choose a different password.",
      400
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/`,
    },
  });

  if (error) {
    logger.warn({ code: error.code, message: error.message }, "Signup failed");
    if (error.code === "user_already_exists") {
      throw new AppError("CONFLICT", "An account with this email already exists.", 409);
    }
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

  // Send welcome email — fire-and-forget (never block signup on email failure)
  if (prismaUser) {
    const firstName = firstNameFromEmail(parsed.data.email);
    render(
      WelcomeEmail({
        firstName,
        shopUrl: `${getSiteUrl()}/shop`,
      })
    )
      .then((html: string) =>
        sendEmail({
          to: parsed.data.email,
          subject: `Welcome to GVSwift, ${firstName}! 🎉`,
          html,
          sender: 'noreply',
        })
      )
      .catch((emailErr: unknown) =>
        logger.warn({ userId: prismaUser!.id, error: emailErr }, 'Welcome email failed — non-fatal')
      );
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
