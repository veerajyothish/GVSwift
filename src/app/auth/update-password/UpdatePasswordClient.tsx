"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface UpdatePasswordClientProps {
  hasSession: boolean;
}

export default function UpdatePasswordClient({ hasSession }: UpdatePasswordClientProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = (): string | null => {
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (updateError) {
        setError(updateError.message || "Failed to update password.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      
      // Sign out to clear the recovery session cookies
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});

      setTimeout(() => {
        router.push("/login?success=password_updated");
      }, 2500);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Brand wordmark */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: "40px", display: "flex", justifyContent: "center" }}>
        <Image
          src="/logo.png"
          alt="GVSwift Logo"
          width={228}
          height={52}
          style={{
            height: "52px",
            width: "auto",
            objectFit: "contain",
          }}
        />
      </Link>

      {/* Card */}
      <div className="auth-card">
        {!hasSession ? (
          /* Expired / Invalid link layout */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "26px",
                fontWeight: 400,
                fontStyle: "italic",
                color: "var(--color-accent)",
                marginBottom: "12px",
              }}
            >
              Link Invalid or Expired
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
                marginBottom: "28px",
              }}
            >
              Your password recovery link is invalid, expired, or has already been used. Please request a new recovery link to reset your password.
            </p>
            <Button
              onClick={() => router.push("/auth/forgot-password")}
              variant="primary"
              style={{ width: "100%", minHeight: "48px" }}
            >
              Request a New Link
            </Button>
            <div className="auth-footer-divider">
              <Link href="/login" className="auth-footer-link" style={{ fontSize: "14px" }}>
                Return to Login
              </Link>
            </div>
          </div>
        ) : success ? (
          /* Success message state */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "26px",
                fontWeight: 400,
                fontStyle: "italic",
                color: "var(--color-accent)",
                marginBottom: "12px",
              }}
            >
              Password Updated
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
                marginBottom: "8px",
              }}
            >
              Your password has been successfully updated.
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--color-text-secondary)",
                fontStyle: "italic",
              }}
            >
              Redirecting you to login page...
            </p>
          </div>
        ) : (
          /* Form state */
          <>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "26px",
                fontWeight: 400,
                fontStyle: "italic",
                color: "var(--color-accent)",
                textAlign: "center",
                marginBottom: "6px",
              }}
            >
              Set new password
            </h1>
            <p className="auth-card-subtitle">Create a secure new password for your account</p>

            {error && (
              <div className="alert-banner alert-error" style={{ marginBottom: "20px" }}>
                <span>⚠</span>
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="input-group margin-0">
                <label htmlFor="password" className="input-label input-required">New password</label>
                <input
                  id="password"
                  type="password"
                  className="input-field"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>

              <div className="input-group margin-0">
                <label htmlFor="confirmPassword" className="input-label input-required">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input-field"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
                style={{ width: "100%", minHeight: "48px", marginTop: "8px" }}
              >
                Reset Password
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
