"use client";

import React, { useState } from "react";
import { downloadCsv } from "@/lib/exportCsv";
import { useToast } from "@/components/ui/Toast";

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

export default function OrderExportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusVal, setStatusVal] = useState("ALL");
  const { toast } = useToast();

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (statusVal && statusVal !== "ALL") params.set("status", statusVal);

      const res = await fetch(`/api/v1/admin/export/orders?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch orders data");
      }
      const data = await res.json();
      const today = new Date().toISOString().split("T")[0];
      downloadCsv(`gvswift-orders-${today}.csv`, data);
      toast.success("Orders exported successfully");
      setIsOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
      >
        <svg
          className="icon-sm"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          style={{ width: "16px", height: "16px" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Export CSV
      </button>

      {isOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-panel" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Export Orders CSV</h2>
                <p className="modal-subtitle">Filter orders before downloading report</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="modal-close-btn"
                aria-label="Close export dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExport} className="modal-body flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label">From Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">To Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Status</label>
                <select
                  className="input-field"
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${isLoading ? "btn-loading" : ""}`}
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "#fff",
                    borderColor: "var(--color-accent)",
                  }}
                  disabled={isLoading}
                >
                  Export
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
