"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AdminOrderListItem } from "@/features/orders/service";
import { useToast } from "@/components/ui/Toast";
import { downloadCsv } from "@/lib/exportCsv";

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
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [orders, setOrders] = useState<AdminOrderListItem[]>(initialOrders);
  const [searchVal, setSearchVal] = useState(searchParams.get("search") ?? "");
  const [statusVal, setStatusVal] = useState(searchParams.get("status") ?? "ALL");
  const [startDateVal, setStartDateVal] = useState(searchParams.get("startDate") ?? "");
  const [endDateVal, setEndDateVal] = useState(searchParams.get("endDate") ?? "");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // Sync state with incoming props
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Reset selection when orders (page or filters) change
  useEffect(() => {
    setSelectedIds([]);
  }, [orders]);

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

  const handleBulkApply = async () => {
    if (selectedIds.length === 0) return;
    if (!bulkStatus) {
      toast.error("Please select a status to update to.");
      return;
    }

    setIsApplying(true);
    try {
      const res = await fetch("/api/v1/admin/orders/bulk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderIds: selectedIds,
          status: bulkStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update orders");
      }

      const statusLabel = STATUS_OPTIONS.find(o => o.value === bulkStatus)?.label || bulkStatus;
      toast.success(`${selectedIds.length} orders updated to ${statusLabel}`);
      setSelectedIds([]);
      setBulkStatus("");
      
      // Refresh table data
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleExportSelected = () => {
    const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));
    if (selectedOrders.length === 0) return;

    const rows = selectedOrders.map((order) => ({
      "Order ID": order.id,
      "Order Number": order.id.slice(0, 8).toUpperCase(),
      "Customer Name": "",
      "Customer Email": order.customerEmail,
      "Status": order.status,
      "Items Count": "",
      "Subtotal (₹)": (order.totalPaise / 100).toFixed(2),
      "Discount (₹)": "0.00",
      "Total (₹)": (order.totalPaise / 100).toFixed(2),
      "Coupon Code": "",
      "Payment Method": "COD",
      "Created Date": new Date(order.createdAt).toISOString(),
      "Shipping Name": "",
      "Shipping City": "",
      "Shipping State": "",
      "Shipping Pincode": "",
    }));

    downloadCsv(`gvswift-selected-orders-${new Date().toISOString().split("T")[0]}.csv`, rows);
    toast.success(`${selectedOrders.length} orders exported successfully`);
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

      {/* Bulk action bar */}
      <div
        style={{
          maxHeight: selectedIds.length > 0 ? "200px" : "0px",
          opacity: selectedIds.length > 0 ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.3s ease-in-out",
          marginBottom: selectedIds.length > 0 ? "1rem" : "0px",
        }}
      >
        <div className="card p-4 flex flex-wrap items-center justify-between gap-4" style={{ backgroundColor: "color-mix(in oklch, var(--color-accent) 6%, var(--color-surface))", borderColor: "color-mix(in oklch, var(--color-accent) 15%, var(--color-border))" }}>
          <div className="flex items-center gap-4">
            <span className="text-primary font-medium text-sm">
              {selectedIds.length} order{selectedIds.length !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-accent text-sm underline hover:text-accent-dark"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="input-field margin-0 py-2 px-3 text-sm"
              style={{ width: "180px", minHeight: "38px" }}
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              disabled={isApplying}
            >
              <option value="">Update Status...</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <button
              className={`btn ${isApplying ? "btn-loading" : ""}`}
              style={{
                backgroundColor: "var(--color-accent)",
                color: "#fff",
                borderColor: "var(--color-accent)",
                borderRadius: "9999px",
                padding: "8px 20px",
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                minHeight: "38px"
              }}
              onClick={handleBulkApply}
              disabled={isApplying || !bulkStatus}
            >
              Apply
            </button>

            <button
              className="btn btn-secondary"
              style={{
                borderRadius: "9999px",
                padding: "8px 20px",
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                minHeight: "38px"
              }}
              onClick={handleExportSelected}
              disabled={isApplying}
            >
              <svg className="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export Selected
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-responsive">
        <table className="admin-table w-full" style={{ minWidth: "800px" }}>
          <thead>
            <tr>
              <th style={{ width: "40px" }}>
                <input
                  type="checkbox"
                  checked={orders.length > 0 && orders.every((o) => selectedIds.includes(o.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(orders.map((o) => o.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    width: "16px",
                    height: "16px",
                    accentColor: "var(--color-accent)",
                  }}
                />
              </th>
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
                <td colSpan={8} className="text-center text-secondary py-20">
                  No orders found matching the filter criteria.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const badgeColor = STATUS_COLORS[order.status] ?? "var(--color-text-secondary)";
                const isSelected = selectedIds.includes(order.id);

                return (
                  <tr
                    key={order.id}
                    className="admin-table-row"
                    style={{
                      backgroundColor: isSelected
                        ? "color-mix(in oklch, var(--color-accent) 6%, var(--color-surface))"
                        : undefined,
                    }}
                  >
                    <td style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => [...prev, order.id]);
                          } else {
                            setSelectedIds((prev) => prev.filter((id) => id !== order.id));
                          }
                        }}
                        style={{
                          cursor: "pointer",
                          width: "16px",
                          height: "16px",
                          accentColor: "var(--color-accent)",
                        }}
                      />
                    </td>
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

