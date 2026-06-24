"use client";

import React, { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface VerificationBannerProps {
  email: string;
  isVerified: boolean;
}

export function VerificationBanner({ email, isVerified }: VerificationBannerProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (isVerified) {
    return null;
  }

  async function handleResend() {
    setLoading(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-card, #fcf9f8)",
        border: "1px solid var(--color-border, #e5dcd6)",
        borderLeft: "4px solid var(--color-primary, #561922)",
        padding: "16px 20px",
        borderRadius: "var(--radius-md, 8px)",
        marginBottom: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <span style={{ color: "var(--color-primary, #561922)", fontSize: "18px", fontWeight: "bold" }}>
          ✉️
        </span>
        <div>
          <h4
            style={{
              margin: 0,
              fontFamily: "var(--font-heading, 'EB Garamond', serif)",
              fontSize: "18px",
              color: "var(--color-primary, #561922)",
            }}
          >
            Email Verification Required
          </h4>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--color-text-secondary, #6b5c53)" }}>
            A confirmation link was sent to <strong>{email}</strong>. Please verify your email to unlock checkout and full account features.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <button
          onClick={handleResend}
          disabled={loading || success}
          className="btn btn-secondary"
          style={{
            padding: "6px 12px",
            fontSize: "13px",
            minHeight: "32px",
          }}
        >
          {loading ? "Sending..." : success ? "✓ Email Resent" : "Resend Verification Email"}
        </button>

        {success && (
          <span style={{ fontSize: "13px", color: "var(--color-success, #2e7d32)" }}>
            Verification link successfully resent! Please check your inbox.
          </span>
        )}

        {errorMsg && (
          <span style={{ fontSize: "13px", color: "var(--color-error, #d32f2f)" }}>
            ⚠ {errorMsg}
          </span>
        )}
      </div>
    </div>
  );
}
