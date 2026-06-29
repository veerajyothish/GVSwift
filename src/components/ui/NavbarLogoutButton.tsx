"use client";

import React, { useState } from "react";
import { performClientLogout } from "@/lib/auth/logout";

/**
 * Client Component logout button.
 * Calls the logout API then redirects to homepage.
 * Separated from NavbarAuthLinks so the parent can remain a Server Component.
 */
export function NavbarLogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await performClientLogout();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="site-navbar-link"
      style={{
        background: "transparent",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--color-text-secondary)",
        padding: "8px 12px",
        borderRadius: "var(--radius-md)",
        transition: "color 0.2s ease, background-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.color = "var(--color-error)";
          e.currentTarget.style.backgroundColor = "rgba(255,92,92,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--color-text-secondary)";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {loading ? "Signing out…" : "Sign Out"}
    </button>
  );
}
