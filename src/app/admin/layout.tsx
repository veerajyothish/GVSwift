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
    <div className="min-h-screen flex flex-col bg-default">
      {/* Admin Nav Shell */}
      <header className="admin-header" aria-label="Admin navigation">
        <div className="site-navbar-inner flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="site-navbar-brand">
              <span className="site-navbar-logo">GV</span>
              <span className="site-navbar-name">Admin</span>
            </Link>

            <nav className="flex items-center gap-3" aria-label="Admin sections">
              <Link href="/admin/products" className="site-navbar-link">
                Products
              </Link>
              <Link href="/admin/orders" className="site-navbar-link">
                Orders
              </Link>
              <Link href="/admin/risk" className="site-navbar-link">
                Risk Rules
              </Link>
              <Link href="/admin/complaints" className="site-navbar-link">
                Complaints
              </Link>
              <Link href="/admin/settings" className="site-navbar-link">
                Settings
              </Link>
            </nav>
          </div>

          <div>
            <Link href="/" className="site-navbar-link text-secondary text-13">
              Back to Store
            </Link>
          </div>
        </div>
      </header>
      
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
