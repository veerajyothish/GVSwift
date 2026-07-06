import { listShops } from "@/features/catalog/repository";
import Link from "next/link";
import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/guards";
import ShopListTable from "./components/ShopListTable";

export const metadata: Metadata = {
  title: "Shop Management — GVSwift Admin",
};

export default async function AdminShopsPage() {
  await requireAdmin();

  // Load all shops for the admin list
  const shops = await listShops();

  return (
    <div className="admin-page-container">
      <div className="admin-page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="admin-page-title">Shops Management</h1>
          <p className="admin-page-subtitle">
            {shops.length} shop{shops.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/admin/shops/new" className="btn btn-primary btn-premium">
          <svg style={{ marginRight: "6px", width: "16px", height: "16px", verticalAlign: "middle" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Shop
        </Link>
      </div>

      <ShopListTable initialShops={shops} />
    </div>
  );
}
