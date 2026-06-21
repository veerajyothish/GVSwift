/**
 * features/auth/service.ts — Auth business logic
 *
 * Handles signup (creates Prisma User row after Supabase account creation),
 * login, logout, and password reset.
 *
 * WHY a separate service: route handlers call here; the service holds
 * all logic so it's testable without spinning up Next.js routing.
 * See CONTEXT.md §3 (business logic out of route files).
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
    .max(72, "Password too long"), // bcrypt limit
});

export const LoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Creates a Supabase auth account and the corresponding Prisma User row.
 *
 * Supabase sends a verification email; the user must confirm before checking
 * out (docs/03-Security-Access.md §1). Browsing and cart access are open
 * to unverified accounts.
 *
 * Returns the Prisma User record on success.
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
    // Map Supabase error codes to user-safe messages — never forward raw errors
    if (error.code === "user_already_exists") {
      throw new AppError("CONFLICT", "An account with this email already exists.", 409);
    }
    throw new AppError("INTERNAL_ERROR", "Signup failed. Please try again.", 500);
  }

  if (!data.user) {
    throw new AppError("INTERNAL_ERROR", "Signup failed. Please try again.", 500);
  }

  // Create the Prisma User row — this is GVSwift's application-level user record.
  // The Supabase auth user (data.user) is the auth identity only.
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
    // Return same message for wrong-email and wrong-password — prevent
    // user enumeration (attacker can't distinguish "no account" from "wrong password")
    throw new AppError(
      "UNAUTHORIZED",
      "Invalid email or password.",
      401
    );
  }

  // Ensure Prisma User row exists (handles edge case where auth exists but DB row doesn't)
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
