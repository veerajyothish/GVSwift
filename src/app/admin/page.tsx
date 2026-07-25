import React from "react";
import Link from "next/link";

export default async function AdminPage() {

  const adminLinks = [
    { href: "/admin/orders", icon: "📦", label: "Orders", desc: "Manage and fulfill customer orders." },
    { href: "/admin/products", icon: "🛍️", label: "Products", desc: "Manage catalog, inventory, and variants." },
    { href: "/admin/categories", icon: "📁", label: "Categories", desc: "Organize products into categories." },
    { href: "/admin/shops", icon: "🏪", label: "Shops", desc: "Manage store partners and boutiques." },
    { href: "/admin/customers", icon: "👥", label: "Customers", desc: "View users and manage accounts." },
    { href: "/admin/banners", icon: "🖼️", label: "Banners", desc: "Manage homepage promotional banners." },
    { href: "/admin/coupons", icon: "🎟️", label: "Coupons", desc: "Create and manage discount codes." },
    { href: "/admin/welcome-offer", icon: "🎁", label: "Welcome Offer", desc: "Configure new user welcome offers." },
    { href: "/admin/loyalty", icon: "⭐", label: "Loyalty", desc: "Manage customer loyalty programs." },
    { href: "/admin/complaints", icon: "🎫", label: "Complaints", desc: "Handle customer support tickets." },
    { href: "/admin/risk", icon: "🛡️", label: "Risk Rules", desc: "Configure COD eligibility and fraud thresholds." },
    { href: "/admin/audit-logs", icon: "📝", label: "Audit Logs", desc: "Review system activity and security logs." },
    { href: "/admin/settings", icon: "⚙️", label: "Settings", desc: "Global store settings and constants." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          paddingBottom: "var(--space-6)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(32px, 4vw, 44px)",
              fontWeight: 400,
              fontStyle: "normal",
              color: "var(--color-text-primary)",
              marginBottom: "6px",
            }}
          >
            Admin Console
          </h1>
          <p style={{ fontSize: "15px", color: "var(--color-text-secondary)" }}>
            Welcome back. Select an option below to manage your store operations.
          </p>
        </div>
      </header>

      {/* ── Quick nav tiles ─────────────────────────────────────────────── */}
      <section>
        <div 
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {adminLinks.map(({ href, icon, label, desc }) => (
            <Link
              key={label}
              href={href}
              style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%" }}
            >
              <div
                className="hover-lift"
                style={{
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  height: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span 
                    style={{ 
                      fontSize: "24px",
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "rgba(107,30,46,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {icon}
                  </span>
                  <h3 style={{ fontSize: "18px", fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
                    {label}
                  </h3>
                </div>
                <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0, flex: 1 }}>
                  {desc}
                </p>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-accent)", marginTop: "8px", display: "inline-block" }}>
                  Manage {label} &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}