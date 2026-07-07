"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const handleResendVerification = async () => {
    setError(null);
    setResendSuccess(null);
    setResendLoading(true);
    try {
      const res = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend verification email.");
      } else {
        setResendSuccess(data.message || "Verification email sent!");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      fetch("/api/v1/loyalty/ref-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: ref }),
      }).catch(() => {});
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      const callbackUrl = window.location.origin + "/auth/callback" + (ref ? `?ref=${ref}` : "");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl },
      });
      if (error) { setError(error.message); setGoogleLoading(false); }
    } catch {
      setError("Failed to initialize Google sign-in. Please try again.");
      setGoogleLoading(false);
    }
  };

  const validate = (): string | null => {
    if (!email.trim()) return "Email address is required.";
    if (!/\S+@\S+\.\S+/.test(email.trim())) return "Enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed."); setLoading(false); return; }
      
      setIsSignedUp(true);
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Link href="/" style={{ textDecoration: "none", marginBottom: "40px", display: "block", textAlign: "center" }}>
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "32px",
            fontWeight: 700,
            fontStyle: "italic",
            color: "var(--color-accent)",
            letterSpacing: "0.06em",
          }}
        >
          GVSwift
        </span>
      </Link>

      <div className="auth-card">
        {isSignedUp ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✉️</div>
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
              Verify your email
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
                marginBottom: "28px",
              }}
            >
              We&apos;ve sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.
            </p>
            
            {error && (
              <div className="alert-banner alert-error" style={{ marginBottom: "20px" }}>
                <span>⚠</span><div>{error}</div>
              </div>
            )}

            {resendSuccess && (
              <div className="alert-banner alert-success" style={{ marginBottom: "20px" }}>
                <span>✓</span><div>{resendSuccess}</div>
              </div>
            )}

            <Button
              onClick={handleResendVerification}
              variant="primary"
              loading={resendLoading}
              disabled={resendLoading}
              style={{ width: "100%", minHeight: "48px", marginBottom: "16px" }}
            >
              Resend Verification Email
            </Button>
            <div className="auth-footer-divider">
              <Link href="/login" className="auth-footer-link" style={{ fontSize: "14px" }}>
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
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
              Create your account
            </h1>
            <p className="auth-card-subtitle">Shop with confidence across India</p>

        {error && (
          <div className="alert-banner alert-error" style={{ marginBottom: "20px" }}>
            <span>⚠</span><div>{error}</div>
          </div>
        )}

        <Button type="button" variant="secondary" onClick={handleGoogleSignIn}
          disabled={loading || googleLoading} loading={googleLoading}
          style={{ width: "100%", minHeight: "48px", marginBottom: "20px", gap: "10px" }}>
          {!googleLoading && (
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </Button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
          <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="input-group margin-0">
            <label htmlFor="email" className="input-label input-required">Email address</label>
            <input id="email" type="email" className="input-field" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" disabled={loading} />
          </div>
          <div className="input-group margin-0">
            <label htmlFor="password" className="input-label input-required">Password</label>
            <input id="password" type="password" className="input-field" placeholder="At least 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" disabled={loading} />
          </div>
          <div className="input-group margin-0">
            <label htmlFor="confirm-password" className="input-label input-required">Confirm password</label>
            <input id="confirm-password" type="password" className="input-field" placeholder="Re-enter your password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" disabled={loading} />
          </div>
           <Button 
            type="submit" 
            variant="primary" 
            loading={loading} 
            disabled={loading || googleLoading} 
            style={{ width: "100%", minHeight: "48px", marginTop: "8px" }}
          >
            Create Account
          </Button>
        </form>

        <div className="auth-footer-divider">
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
            Already have an account?{" "}
            <Link href="/login" className="auth-footer-link">Sign in</Link>
          </p>
        </div>
          </>
        )}
      </div>

      <p className="auth-disclaimer">
        By signing up you agree to our{" "}
        <Link href="/terms" className="auth-footer-link">Terms of Service</Link>{" "}and{" "}
        <Link href="/privacy" className="auth-footer-link">Privacy Policy</Link>.
      </p>
    </div>
  );
}