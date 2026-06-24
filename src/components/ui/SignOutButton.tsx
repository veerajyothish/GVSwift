"use client";

import React, { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface SignOutButtonProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Reusable sign-out button.
 * Calls supabase.auth.signOut() and redirects to /login.
 * Works for both email/password and Google OAuth sessions.
 */
export function SignOutButton({ className, style, children }: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      // Even on error, redirect to login
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={className}
      style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, ...style }}
      aria-label="Sign out"
    >
      {loading ? "Signing out…" : (children ?? "Sign Out")}
    </button>
  );
}
