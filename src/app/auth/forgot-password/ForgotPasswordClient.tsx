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
            <span style={{ flexShrink: 0, marginTop: "1px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <div>{error}</div>
          </div>
        )}

        {successMessage && (
          <div className="alert-banner alert-success" style={{ marginBottom: "20px" }}>
            <span style={{ flexShrink: 0, marginTop: "1px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
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
