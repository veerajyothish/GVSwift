"use client";

/**
 * AccountSidebar — Elegant minimalist sidebar
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/ui/SignOutButton";

export default function AccountSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/account/profile",   label: "Profile" },
    { href: "/account/orders",    label: "Orders" },
    { href: "/account/addresses", label: "Address Book" },
    { href: "/account/wishlist",  label: "Wishlist" },
    { href: "/account/loyalty",   label: "Loyalty & Rewards" },
    { href: "/support",           label: "Support" },
    { href: "/account/settings",  label: "Settings" },
  ];

  return (
    <aside
      aria-label="Account navigation"
      style={{ width: "100%", marginBottom: "32px" }}
    >
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
        aria-label="Account sections"
      >
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 16px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                textDecoration: "none",
                color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                background: isActive ? "rgba(107,30,46,0.04)" : "transparent",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {link.label}
            </Link>
          );
        })}

        <div style={{ padding: "12px 16px", marginTop: "16px", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <Link
            href="/"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "var(--color-text-secondary)",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            &larr; Back to Store
          </Link>
          <SignOutButton />
        </div>
      </nav>
    </aside>
  );
}