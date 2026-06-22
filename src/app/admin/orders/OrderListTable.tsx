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
      <div
        className="card p-4"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {/* Customer search */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ marginBottom: "6px" }}>Search Customer</label>
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
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ marginBottom: "6px" }}>Status</label>
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
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ marginBottom: "6px" }}>Start Date</label>
            <input
              type="date"
              className="input-field"
              value={startDateVal}
              onChange={handleStartDateChange}
              style={{ colorScheme: "dark" }}
            />
          </div>

          {/* End Date */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ marginBottom: "6px" }}>End Date</label>
            <input
              type="date"
              className="input-field"
              value={endDateVal}
              onChange={handleEndDateChange}
              style={{ colorScheme: "dark" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Found {totalCount} orders
          </span>

          <button
            className="btn btn-secondary"
            onClick={handleClearFilters}
            style={{ padding: "6px 16px", minHeight: "36px", fontSize: "13px" }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div
        className="card"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          overflowX: "auto",
        }}
      >
        <table className="admin-table w-full" style={{ borderCollapse: "collapse", minWidth: "800px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
              <th style={{ padding: "16px", color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500 }}>
                Order ID
              </th>
              <th style={{ padding: "16px", color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500 }}>
                Date Placed
              </th>
              <th style={{ padding: "16px", color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500 }}>
                Customer
              </th>
              <th style={{ padding: "16px", color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500 }}>
                Attempts
              </th>
              <th style={{ padding: "16px", color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500 }}>
                Total
              </th>
              <th style={{ padding: "16px", color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500 }}>
                Status
              </th>
              <th style={{ padding: "16px", color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500, textAlign: "right" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-secondary)" }}>
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
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    {/* Short ID */}
                    <td style={{ padding: "16px" }}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        style={{
                          fontFamily: "monospace",
                          color: "var(--color-accent)",
                          fontWeight: 500,
                          textDecoration: "none",
                        }}
                      >
                        {order.id.slice(0, 8)}…
                      </Link>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "16px", color: "var(--color-text-primary)", fontSize: "14px" }}>
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Customer */}
                    <td style={{ padding: "16px" }}>
                      <div style={{ color: "var(--color-text-primary)", fontSize: "14px" }}>
                        {order.customerEmail}
                      </div>
                      {order.customerPhone && (
                        <div style={{ color: "var(--color-text-secondary)", fontSize: "12px", marginTop: "2px" }}>
                          {order.customerPhone}
                        </div>
                      )}
                    </td>

                    {/* Attempts */}
                    <td style={{ padding: "16px", color: "var(--color-text-primary)", fontSize: "14px" }}>
                      {order.deliveryAttempts}
                    </td>

                    {/* Total */}
                    <td style={{ padding: "16px", color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 500 }}>
                      {formatPaise(order.totalPaise)}
                    </td>

                    {/* Status Badge & Auto-Cancelled indicator */}
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
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
                          <span
                            style={{
                              backgroundColor: "rgba(224, 86, 86, 0.1)",
                              color: "var(--color-error)",
                              border: "1px solid rgba(224, 86, 86, 0.2)",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontSize: "11px",
                              fontWeight: 500,
                            }}
                          >
                            Auto-Cancelled: Stock
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action link */}
                    <td style={{ padding: "16px", textAlign: "right" }}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", minHeight: "30px", fontSize: "13px", display: "inline-flex" }}
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
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "8px" }}>
          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
            style={{ padding: "6px 16px", minHeight: "36px", fontSize: "13px" }}
          >
            &larr; Previous
          </button>

          <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
            Page <strong>{currentPage}</strong> of {totalPages}
          </span>

          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
            style={{ padding: "6px 16px", minHeight: "36px", fontSize: "13px" }}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
