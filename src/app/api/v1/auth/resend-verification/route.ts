import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * POST /api/v1/auth/resend-verification
 *
 * Requests Supabase Auth to resend the account confirmation / verification email.
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

    // Trigger Supabase resend email confirmation
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=/`,
      },
    });

    if (error) {
      logger.warn(
        { email, code: error.code, message: error.message },
        "resend confirmation failed internally"
      );
      return NextResponse.json(
        { error: error.message || "Failed to resend verification email." },
        { status: 400 }
      );
    }

    logger.info({ email }, "Verification email resent successfully");

    return NextResponse.json(
      {
        message: "Verification email resent successfully! Please check your inbox.",
      },
      { status: 200 }
    );
  } catch (err) {
    logger.error({ error: err }, "Error in resend-verification API route");
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
