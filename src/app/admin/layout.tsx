import { requireAdmin } from "@/lib/auth/guards";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect or throw before rendering if not authorized.
  await requireAdmin();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--color-bg)" }}>
      {/* Admin Nav Shell */}
      <header className="site-navbar" aria-label="Admin navigation" style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "rgba(11, 11, 12, 0.95)" }}>
        <div className="site-navbar-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="flex items-center gap-5">
            <Link href="/admin" className="site-navbar-brand">
              <span className="site-navbar-logo">GV</span>
              <span className="site-navbar-name">Admin</span>
            </Link>

            <nav className="flex items-center gap-3" aria-label="Admin sections">
              <Link href="/admin/products" className="site-navbar-link">
                Products
              </Link>
              <Link href="/admin/risk" className="site-navbar-link">
                Risk Rules
              </Link>
              <Link href="/admin/settings" className="site-navbar-link">
                Settings
              </Link>
            </nav>
          </div>

          <div>
            <Link href="/" className="site-navbar-link" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
              Back to Store
            </Link>
          </div>
        </div>
      </header>
      
      <main style={{ flex: 1, padding: "32px 20px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
