"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      router.push(redirectTo);
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

      {/* Login card */}
      <div className="auth-card">
        <h1 className="text-xl font-semibold auth-card-title">
          Welcome back
        </h1>
        <p className="auth-card-subtitle">
          Sign in to your GVSwift account
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-8"
          >
            Sign In
          </Button>
        </form>

        <div className="auth-footer-divider">
          <p className="text-sm footer-text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="auth-footer-link">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Footer note */}
      <p className="auth-disclaimer">
        By signing in you agree to our{" "}
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
