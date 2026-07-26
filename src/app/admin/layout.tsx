import { requireAdmin } from "@/lib/auth/guards";
import Link from "next/link";
import Image from "next/image";
import { SignOutButton } from "@/components/ui/SignOutButton";

/**
 * Material Symbols font — loaded ONLY in the admin layout,
 * not globally, to avoid blocking public page loads.
 */
const MATERIAL_SYMBOLS_CSS =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect or throw before rendering if not authorized.
  const adminUser = await requireAdmin();

  // Build a display name: prefer real name, fall back to email prefix
  const displayName =
    adminUser.name?.trim() ||
    (adminUser.email ? adminUser.email.split("@")[0] : "Admin");

  // Build initials for avatar
  const getInitials = (n: string) => {
    const parts = n.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length >= 2)
      return (parts[0][0] + parts[0][1]).toUpperCase();
    return (n[0] || "A").toUpperCase();
  };
  const initials = getInitials(displayName);

  return (
    <>
      <link rel="stylesheet" href={MATERIAL_SYMBOLS_CSS} />
      <div className="min-h-screen flex bg-default" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* ── Left Sidebar ───────────────────────────────────────────────── */}
      <aside
        className="admin-sidebar"
        style={{
          width: "240px",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          backgroundColor: "#fff",
        }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)" }}>
          <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <Image
              src="/logo.png"
              alt="GVSwift Logo"
              width={120}
              height={28}
              style={{ height: "28px", width: "auto", objectFit: "contain" }}
            />
            <span style={{ fontSize: "11px", letterSpacing: "0.08em", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
              Admin
            </span>
          </Link>
        </div>

        <nav style={{ flex: 1, padding: "24px 16px", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto" }} aria-label="Admin sections">
          {/* Catalog Group */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingLeft: "8px" }}>
              Catalog
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/admin/products" className="site-navbar-link" style={{ padding: "6px 8px", display: "block" }}>Products</Link>
              <Link href="/admin/categories" className="site-navbar-link" style={{ padding: "6px 8px", display: "block" }}>Categories</Link>
            </div>
          </div>

          {/* Users Group */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingLeft: "8px" }}>
              Users
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/admin/customers" className="site-navbar-link" style={{ padding: "6px 8px", display: "block" }}>Customers</Link>
              <Link href="/admin/shops" className="site-navbar-link" style={{ padding: "6px 8px", display: "block" }}>Shops</Link>
            </div>
          </div>

          {/* Marketing Group */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingLeft: "8px" }}>
              Marketing
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/admin/orders" className="site-navbar-link" style={{ padding: "6px 8px", display: "block" }}>Orders</Link>
              <Link href="/admin/coupons" className="site-navbar-link" style={{ padding: "6px 8px", display: "block" }}>Coupons</Link>
              <Link href="/admin/welcome-offer" className="site-navbar-link" style={{ padding: "6px 8px", display: "block" }}>Welcome Offer</Link>
              <Link href="/admin/loyalty" className="site-navbar-link" style={{ padding: "6px 8px", display: "block" }}>Loyalty</Link>
            </div>
          </div>

          {/* System Group */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingLeft: "8px" }}>
              System
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/admin/risk" className="site-navbar-link" style={{ padding: "6px 8px", display: "block" }}>Risk Rules</Link>
              <Link href="/admin/complaints" className="site-navbar-link" style={{ padding: "6px 8px", display: "block" }}>Complaints</Link>
              <Link href="/admin/settings" className="site-navbar-link" style={{ padding: "6px 8px", display: "block" }}>Settings</Link>
              <Link href="/admin/audit-logs" className="site-navbar-link" style={{ padding: "6px 8px", display: "block" }}>Audit Logs</Link>
            </div>
          </div>
        </nav>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: "64px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 24px",
            backgroundColor: "#fff",
          }}
        >
          <div className="flex items-center gap-4">
            <Link href="/account/profile" className="site-navbar-link text-secondary text-13">
              Profile
            </Link>

            <div className="flex items-center gap-2" style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: "16px" }}>
              <div
                aria-hidden="true"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-accent)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  flexShrink: 0,
                  letterSpacing: "0.04em",
                }}
              >
                {initials}
              </div>
              <div className="flex flex-col" style={{ lineHeight: 1.2 }}>
                <span
                  className="text-primary font-semibold"
                  style={{ fontSize: "13px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={displayName}
                >
                  {displayName}
                </span>
                <span className="admin-badge" style={{ fontSize: "10px" }}>
                  Admin
                </span>
              </div>
              <SignOutButton
                className="site-navbar-link text-secondary"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  marginLeft: "8px",
                }}
              >
                Sign Out
              </SignOutButton>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="admin-main flex-1" style={{ padding: "24px", overflowY: "auto" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
