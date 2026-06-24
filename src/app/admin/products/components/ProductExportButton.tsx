"use client";

import React, { useState } from "react";
import { downloadCsv } from "@/lib/exportCsv";
import { useToast } from "@/components/ui/Toast";

export default function ProductExportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/export/products");
      if (!res.ok) {
        throw new Error("Failed to fetch products data");
      }
      const data = await res.json();
      const today = new Date().toISOString().split("T")[0];
      downloadCsv(`gvswift-products-${today}.csv`, data);
      toast.success("Products exported successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className={`btn btn-secondary ${isLoading ? "btn-loading" : ""}`}
      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
    >
      {!isLoading && (
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
      )}
      Export CSV
    </button>
  );
}
