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
    <div className="flex flex-col gap-5">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            Order Fulfillment Management
          </h1>
          <p className="text-secondary text-sm mt-4">
            Track delivery attempts, confirm orders, update manual tracking references, and view fraud risk assessments.
          </p>
        </div>
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
