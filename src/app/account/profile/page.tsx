/**
 * /account/profile
 * PDF p.8/12: "My Account" heading + subtitle, left sidebar nav, right main with
 * Personal Information card (EDIT button top-right, avatar, 2-col fields),
 * Security card below with password fields + UPDATE PASSWORD pill CTA.
 */
import React from "react";
import { requireUser } from "@/lib/auth/guards";
import ProfileForm from "./ProfileForm";
import { Metadata } from "next";

export const metadata: Metadata = { title: "My Profile | GVSwift" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Page heading — PDF p.8: large Garamond heading, subtitle */}
      <header
        style={{
          paddingBottom: "20px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(28px, 4vw, 36px)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--color-accent)",
            marginBottom: "6px",
          }}
        >
          My Account
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
          Manage your personal details, security settings, and preferences.
        </p>
      </header>

      {/* Profile form handles Personal Information + Security sections */}
      <ProfileForm
        initialUser={{
          name: user.name || "",
          email: user.email,
          phone: user.phone || "",
          createdAt: user.createdAt.toISOString(),
        }}
      />
    </div>
  );
}