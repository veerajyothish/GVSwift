import React from "react";
import { requireAdmin } from "@/lib/auth/guards";
import { listAdminOrders } from "@/features/orders/service";
import OrderListTable from "./OrderListTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Order Management",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  // Enforces admin permissions on the server
  await requireAdmin();

  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const status = resolvedParams.status || "ALL";
  const userSearch = resolvedParams.search || undefined;
  const startDate = resolvedParams.startDate || undefined;
  const endDate = resolvedParams.endDate || undefined;

  const result = await listAdminOrders({
    page,
    pageSize: 15,
    status,
    userSearch,
    startDate,
    endDate,
  });

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <header style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
          Order Fulfillment Management
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Track delivery attempts, confirm orders, update manual tracking references, and view fraud risk assessments.
        </p>
      </header>

      <OrderListTable
        initialOrders={result.orders}
        totalPages={result.totalPages}
        currentPage={result.page}
        totalCount={result.total}
      />
    </div>
  );
}
