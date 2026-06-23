"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AdminOrderListItem } from "@/features/orders/service";

interface OrderListTableProps {
  initialOrders: AdminOrderListItem[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "ALL" },
  { label: "Placed", value: "PLACED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Out For Delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Failed Delivery", value: "FAILED_DELIVERY" },
  { label: "Returned to Origin (RTO)", value: "RTO" },
  { label: "Return Requested", value: "RETURN_REQUESTED" },
  { label: "Returned", value: "RETURNED" },
];

const STATUS_COLORS: Record<string, string> = {
  PLACED: "var(--color-info)",
  CONFIRMED: "var(--color-info)",
  SHIPPED: "var(--color-accent)",
  OUT_FOR_DELIVERY: "var(--color-accent)",
  DELIVERED: "var(--color-success)",
  CANCELLED: "var(--color-error)",
  FAILED_DELIVERY: "var(--color-warning)",
  RTO: "var(--color-error)",
  RETURN_REQUESTED: "var(--color-warning)",
  RETURNED: "var(--color-text-secondary)",
};

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderListTable({
  initialOrders,
  totalPages,
  currentPage,
  totalCount,
}: OrderListTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [orders, setOrders] = useState<AdminOrderListItem[]>(initialOrders);
  const [searchVal, setSearchVal] = useState(searchParams.get("search") ?? "");
  const [statusVal, setStatusVal] = useState(searchParams.get("status") ?? "ALL");
  const [startDateVal, setStartDateVal] = useState(searchParams.get("startDate") ?? "");
  const [endDateVal, setEndDateVal] = useState(searchParams.get("endDate") ?? "");

  // Sync state with incoming props
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const applyFilters = (search: string, status: string, startDate: string, endDate: string, pageNum = 1) => {
    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }

    if (status && status !== "ALL") {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    if (startDate) {
      params.set("startDate", startDate);
    } else {
      params.delete("startDate");
    }

    if (endDate) {
      params.set("endDate", endDate);
    } else {
      params.delete("endDate");
    }

    if (pageNum > 1) {
      params.set("page", pageNum.toString());
    } else {
      params.delete("page");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyFilters(searchVal, statusVal, startDateVal, endDateVal, 1);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value;
    setStatusVal(nextStatus);
    applyFilters(searchVal, nextStatus, startDateVal, endDateVal, 1);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextStart = e.target.value;
    setStartDateVal(nextStart);
    applyFilters(searchVal, statusVal, nextStart, endDateVal, 1);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextEnd = e.target.value;
    setEndDateVal(nextEnd);
    applyFilters(searchVal, statusVal, startDateVal, nextEnd, 1);
  };

  const handleClearFilters = () => {
    setSearchVal("");
    setStatusVal("ALL");
    setStartDateVal("");
    setEndDateVal("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    applyFilters(searchVal, statusVal, startDateVal, endDateVal, pageNum);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Filters card */}
      <div className="card p-4 flex flex-col gap-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {/* Customer search */}
          <div className="input-group margin-0">
            <label className="input-label mb-4">Search Customer</label>
            <input
              type="text"
              className="input-field"
              placeholder="Email or phone... (Enter)"
              value={searchVal}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          {/* Status filter */}
          <div className="input-group margin-0">
            <label className="input-label mb-4">Status</label>
            <select
              className="input-field"
              value={statusVal}
              onChange={handleStatusChange}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="input-group margin-0">
            <label className="input-label mb-4">Start Date</label>
            <input
              type="date"
              className="input-field"
              value={startDateVal}
              onChange={handleStartDateChange}
              style={{ colorScheme: "dark" }}
            />
          </div>

          {/* End Date */}
          <div className="input-group margin-0">
            <label className="input-label mb-4">End Date</label>
            <input
              type="date"
              className="input-field"
              value={endDateVal}
              onChange={handleEndDateChange}
              style={{ colorScheme: "dark" }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-secondary text-13">
            Found {totalCount} orders
          </span>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-responsive">
        <table className="admin-table w-full" style={{ minWidth: "800px" }}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date Placed</th>
              <th>Customer</th>
              <th>Attempts</th>
              <th>Total</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-secondary py-20">
                  No orders found matching the filter criteria.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const badgeColor = STATUS_COLORS[order.status] ?? "var(--color-text-secondary)";

                return (
                  <tr
                    key={order.id}
                    className="admin-table-row"
                  >
                    {/* Short ID */}
                    <td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs-mono text-accent font-medium"
                      >
                        {order.id.slice(0, 8)}…
                      </Link>
                    </td>

                    {/* Date */}
                    <td className="text-primary text-sm">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Customer */}
                    <td>
                      <div className="text-primary text-sm">
                        {order.customerEmail}
                      </div>
                      {order.customerPhone && (
                        <div className="text-secondary text-xs mt-2">
                          {order.customerPhone}
                        </div>
                      )}
                    </td>

                    {/* Attempts */}
                    <td className="text-primary text-sm">
                      {order.deliveryAttempts}
                    </td>

                    {/* Total */}
                    <td className="text-primary text-sm font-medium">
                      {formatPaise(order.totalPaise)}
                    </td>

                    {/* Status Badge & Auto-Cancelled indicator */}
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className="order-status-badge"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${badgeColor} 15%, transparent)`,
                            color: badgeColor,
                            borderColor: `color-mix(in srgb, ${badgeColor} 25%, transparent)`,
                          }}
                        >
                          {order.status}
                        </span>

                        {order.isAutoCancelled && (
                          <span className="admin-badge admin-badge-error">
                            Auto-Cancelled: Stock
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action link */}
                    <td className="text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="btn btn-secondary btn-sm inline-flex"
                      >
                        Details &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
          >
            &larr; Previous
          </button>

          <span className="text-secondary text-sm">
            Page <strong>{currentPage}</strong> of {totalPages}
          </span>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
