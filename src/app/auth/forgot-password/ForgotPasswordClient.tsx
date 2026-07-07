"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to process request.");
        setLoading(false);
        return;
      }

      setSuccessMessage(data.message || "If an account exists, a reset link has been sent.");
      setEmail("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
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
          Recover password
        </h1>
        <p className="auth-card-subtitle">We will send you a password reset link</p>

        {error && (
          <div className="alert-banner alert-error" style={{ marginBottom: "20px" }}>
            <span>⚠</span>
            <div>{error}</div>
          </div>
        )}

        {successMessage && (
          <div className="alert-banner alert-success" style={{ marginBottom: "20px" }}>
            <span>✓</span>
            <div>{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="input-group margin-0">
            <label htmlFor="email" className="input-label input-required">Email address</label>
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

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
            style={{ width: "100%", minHeight: "48px", marginTop: "8px" }}
          >
            Send Recovery Email
          </Button>
        </form>

        <div className="auth-footer-divider">
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
            Remember your password?{" "}
            <Link href="/login" className="auth-footer-link">Sign in</Link>
          </p>
        </div>
      </div>

      <p className="auth-disclaimer">
        By signing in you agree to our{" "}
        <Link href="/terms" className="auth-footer-link">Terms of Service</Link>{" "}and{" "}
        <Link href="/privacy" className="auth-footer-link">Privacy Policy</Link>.
      </p>
    </div>
  );
}
