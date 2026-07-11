import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * POST /api/v1/auth/forgot-password
 *
 * Requests a password recovery/reset email from Supabase Auth.
 * Returns a neutral success message regardless of whether the email exists.
 *
 * Request body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email?.trim().toLowerCase();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: "A valid email address is required.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const siteUrl = getSiteUrl();

    // Trigger Supabase recovery email flow
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
    });

    if (error) {
      // Log internally for debugging, but still return a neutral success message to the client
      logger.warn(
        { email, code: error.code, message: error.message },
        "resetPasswordForEmail failed internally"
      );
    } else {
      logger.info({ email }, "Password reset email requested successfully");
    }

    // Always return neutral success message to prevent user enumeration
    return NextResponse.json(
      {
        message: "If an account exists for this email, a reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (err) {
    logger.error({ error: err }, "Error in forgot-password API route");
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
