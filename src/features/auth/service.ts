/**
 * features/auth/service.ts — Auth business logic
 *
 * Handles signup (creates Prisma User row after Supabase account creation),
 * login, logout, and password reset.
 */

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

// ─── Input schemas ────────────────────────────────────────────────────────────

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

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Creates a Supabase auth account, the corresponding Prisma User row,
 * and immediately signs the user in so a session cookie is set.
 */
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
    logger.warn("Signup failed", { code: error.code });
    if (error.code === "user_already_exists") {
      throw new AppError("CONFLICT", "An account with this email already exists.", 409);
    }
    throw new AppError("INTERNAL_ERROR", "Signup failed. Please try again.", 500);
  }

  if (!data.user) {
    throw new AppError("INTERNAL_ERROR", "Signup failed. Please try again.", 500);
  }

  // Upsert Prisma User row
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

  // Auto-login: immediately sign in so the session cookie is set,
  // regardless of whether email confirmation is enabled in Supabase.
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (loginError) {
    // Account was created successfully — login will just be manual.
    logger.warn("Auto-login after signup failed", { code: loginError.code });
  }

  return prismaUser;
}

/**
 * Signs in an existing user. Returns the Prisma User record on success.
 */
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
    logger.warn("Login failed", { code: error?.code });
    throw new AppError(
      "UNAUTHORIZED",
      "Invalid email or password.",
      401
    );
  }

  // Ensure Prisma User row exists
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

/**
 * Signs out the current user, clearing the session cookie.
 */
export async function logoutUser() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
