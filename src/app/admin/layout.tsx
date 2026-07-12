import { requireAdmin } from "@/lib/auth/guards";
import Link from "next/link";
import Image from "next/image";
import { SignOutButton } from "@/components/ui/SignOutButton";

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
    <div className="min-h-screen flex flex-col bg-default">
      {/* Admin Nav Shell */}
      <header className="admin-header" aria-label="Admin navigation">
        <div className="site-navbar-inner flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="site-navbar-brand" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Image
                src="/logo.png"
                alt="GVSwift Logo"
                width={150}
                height={36}
                style={{ height: "36px", width: "auto", objectFit: "contain" }}
              />
              <span className="site-navbar-name" style={{ fontSize: "13px", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Admin</span>
            </Link>

            <nav className="flex items-center gap-3" aria-label="Admin sections">
              <Link href="/admin/products" className="site-navbar-link">
                Products
              </Link>
              <Link href="/admin/shops" className="site-navbar-link">
                Shops
              </Link>
              <Link href="/admin/orders" className="site-navbar-link">
                Orders
              </Link>
              <Link href="/admin/customers" className="site-navbar-link">
                Customers
              </Link>
              <Link href="/admin/categories" className="site-navbar-link">
                Categories
              </Link>
              <Link href="/admin/coupons" className="site-navbar-link">
                Coupons
              </Link>
              <Link href="/admin/risk" className="site-navbar-link">
                Risk Rules
              </Link>
              <Link href="/admin/complaints" className="site-navbar-link">
                Complaints
              </Link>
              <Link href="/admin/welcome-offer" className="site-navbar-link">
                Welcome Offer
              </Link>
              <Link href="/admin/loyalty" className="site-navbar-link">
                Loyalty
              </Link>
              <Link href="/admin/settings" className="site-navbar-link">
                Settings
              </Link>
              <Link href="/admin/audit-logs" className="site-navbar-link">
                Audit Logs
              </Link>
            </nav>
          </div>

          {/* Right side: user info + sign out */}
          <div className="flex items-center gap-3">
            <Link href="/account/profile" className="site-navbar-link text-secondary text-13">
              Profile
            </Link>

            {/* Admin user badge */}
            <div className="flex items-center gap-2" style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: "12px" }}>
              <div
                aria-hidden="true"
                style={{
                  width: "30px",
                  height: "30px",
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
                }}
              >
                Sign Out
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>
      
      <main id="main-content" className="admin-main">
        {children}
      </main>
    </div>
  );
}
