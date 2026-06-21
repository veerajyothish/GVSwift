/**
 * Admin layout — requires ADMIN role.
 * requireAdmin() redirects to /login if unauthenticated, throws 403 if
 * authenticated but not ADMIN.
 *
 * TICKET-003 adds the full Supabase Auth integration — this layout is the
 * enforcement point for all /admin/* routes.
 */

import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect or throw before rendering if not authorized.
  // TICKET-003 will ensure requireAdmin() works end-to-end.
  await requireAdmin();

  return (
    <div>
      {/* TICKET-004 will add the admin nav shell */}
      <main>{children}</main>
    </div>
  );
}
