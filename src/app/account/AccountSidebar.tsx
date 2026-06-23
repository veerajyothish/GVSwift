"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AccountSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/account", label: "Profile Dashboard" },
    { href: "/account/addresses", label: "Address Book" },
    { href: "/orders", label: "My Orders" },
    { href: "/support", label: "Support Tickets" },
  ];

  return (
    <aside className="account-sidebar" aria-label="Account navigation">
      <div className="card p-4 flex flex-col gap-2">
        <h3 className="font-semibold text-accent mb-8 text-sm" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
          My Account
        </h3>
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`account-nav-link ${isActive ? "account-nav-link-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-divider-mute my-12" style={{ margin: "12px 0" }} />
        <Link href="/" className="account-nav-link">
          ← Back to Store
        </Link>
      </div>
    </aside>
  );
}
