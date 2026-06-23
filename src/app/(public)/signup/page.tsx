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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "2px",
          textDecoration: "none",
          marginBottom: "40px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-heading), serif",
            fontSize: "32px",
            fontWeight: 700,
            color: "var(--color-accent)",
            letterSpacing: "-0.02em",
          }}
        >
          GV
        </span>
        <span
          style={{
            fontFamily: "var(--font-heading), serif",
            fontSize: "32px",
            fontWeight: 400,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          Swift
        </span>
      </Link>

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "40px 32px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <h1
          className="text-xl font-semibold"
          style={{
            color: "var(--color-text-primary)",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          Create your account
        </h1>
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "14px",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          Shop with confidence across Andhra Pradesh
        </p>

        {error && (
          <div
            className="alert-banner alert-error"
            style={{ marginBottom: "20px" }}
          >
            <span>⚠</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="input-group" style={{ margin: 0 }}>
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

          <div className="input-group" style={{ margin: 0 }}>
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

          <div className="input-group" style={{ margin: 0 }}>
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
            style={{ width: "100%", marginTop: "8px" }}
          >
            Create Account
          </Button>
        </form>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--color-accent)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <p
        style={{
          marginTop: "24px",
          fontSize: "12px",
          color: "var(--color-text-secondary)",
          textAlign: "center",
        }}
      >
        By creating an account you agree to our{" "}
        <Link
          href="/terms"
          style={{ color: "var(--color-accent)", textDecoration: "underline" }}
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          style={{ color: "var(--color-accent)", textDecoration: "underline" }}
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
