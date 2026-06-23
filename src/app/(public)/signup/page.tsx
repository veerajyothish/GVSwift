"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      // Redirect directly to homepage — user is already logged in
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Brand header */}
      <Link href="/" className="auth-brand-link">
        <span className="auth-brand-logo">GV</span>
        <span className="auth-brand-name">Swift</span>
      </Link>

      {/* Signup card */}
      <div className="auth-card">
        <h1 className="text-xl font-semibold auth-card-title">
          Create your account
        </h1>
        <p className="auth-card-subtitle">
          Shop with confidence across India
        </p>

        {error && (
          <div className="alert-banner alert-error mb-20">
            <span>⚠</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="input-group margin-0">
            <label htmlFor="email" className="input-label input-required">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="input-group margin-0">
            <label htmlFor="password" className="input-label input-required">
              Password
            </label>
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
            <label htmlFor="confirm-password" className="input-label input-required">
              Confirm password
            </label>
            <input
              id="confirm-password"
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
            className="w-full mt-8"
          >
            Create Account
          </Button>
        </form>

        <div className="auth-footer-divider">
          <p className="text-sm footer-text-muted">
            Already have an account?{" "}
            <Link href="/login" className="auth-footer-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="auth-disclaimer">
        By signing up you agree to our{" "}
        <Link href="/terms" className="auth-footer-link underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="auth-footer-link underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
