"use client";

import React, { useState } from "react";
import { performClientLogout } from "@/lib/auth/logout";

interface SignOutButtonProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Reusable sign-out button.
 * Calls performClientLogout() to fully clear all sessions.
 */
export function SignOutButton({ className, style, children }: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await performClientLogout();
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <button
      onClick={handleSignOut}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onMouseLeave={() => setActive(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
      disabled={loading}
      className={className}
      style={{
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        transitionProperty: "transform, opacity",
        transitionDuration: "200ms",
        transform: active && !loading ? "scale(0.96)" : "scale(1)",
        ...style
      }}
      aria-label="Sign out"
    >
      {loading ? "Signing out…" : (children ?? "Sign Out")}
    </button>
  );
}
