import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

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

export async function signupUser(input: SignupInput) {
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
  });

  if (error) {
    // TEMP: expose real error for debugging
    logger.warn("Signup failed", { code: error.code, message: error.message });
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

  // Auto-login after signup
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (loginError) {
    logger.warn("Auto-login after signup failed", { code: loginError.code, message: loginError.message });
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
    // TEMP: expose real error for debugging
    logger.warn("Login failed", { code: error?.code, message: error?.message });
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

  return prismaUser;
}

export async function logoutUser() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
