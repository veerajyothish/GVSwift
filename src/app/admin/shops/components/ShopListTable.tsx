"use client";

import React, { useState } from "react";
import LinkNext from "next/link";
import { useToast } from "@/components/ui/Toast";

interface Shop {
  id: string;
  name: string;
  slug: string;
  brandImage: string;
  description: string;
  tagline: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date | string;
}

interface ShopListTableProps {
  initialShops: Shop[];
}

export default function ShopListTable({ initialShops }: ShopListTableProps) {
  const { toast } = useToast();
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter shops locally
  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.tagline && shop.tagline.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && shop.isActive) ||
      (statusFilter === "inactive" && !shop.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleToggleActive = async (shop: Shop) => {
    setActionLoadingId(shop.id);
    try {
      const willBeActive = !shop.isActive;
      const res = await fetch(`/api/v1/admin/shops/${shop.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: willBeActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update shop status.");
      }

      setShops((prev) =>
        prev.map((s) => (s.id === shop.id ? { ...s, isActive: willBeActive } : s))
      );

      toast.success(
        `Shop "${shop.name}" has been ${willBeActive ? "activated" : "deactivated"}.`,
        "Success"
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.", "Error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleFeatured = async (shop: Shop) => {
    setActionLoadingId(shop.id);
    try {
      const willBeFeatured = !shop.isFeatured;
      const res = await fetch(`/api/v1/admin/shops/${shop.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFeatured: willBeFeatured }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update shop featured status.");
      }

      setShops((prev) =>
        prev.map((s) => (s.id === shop.id ? { ...s, isFeatured: willBeFeatured } : s))
      );

      toast.success(
        `Shop "${shop.name}" has been ${willBeFeatured ? "marked as Featured" : "unmarked as Featured"}.`,
        "Success"
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.", "Error");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      {/* Filters Card */}
      <div
        className="card p-4"
        style={{
          backgroundColor: "var(--color-surface-container-low, #f6f3f2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg, 12px)",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", flex: 1, alignItems: "center" }}>
          {/* Search bar */}
          <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "400px" }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "20px",
                color: "var(--color-text-secondary)",
                pointerEvents: "none",
              }}
            >
              search
            </span>
            <input
              type="text"
              className="input-field"
              placeholder="Search shops by name, slug, tagline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: "40px",
                width: "100%",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                backgroundColor: "var(--color-surface)",
                fontSize: "14px",
                height: "40px",
              }}
            />
          </div>

          {/* Status Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
              Status:
            </span>
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              style={{
                minWidth: "130px",
                height: "40px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                fontSize: "13px",
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table view */}
      {filteredShops.length === 0 ? (
        <div className="empty-state card" style={{ padding: "48px", textAlign: "center" }}>
          <div className="empty-state-icon" style={{ fontSize: "40px", marginBottom: "12px" }}>
            🏪
          </div>
          <h3 className="empty-state-title" style={{ fontSize: "18px", fontWeight: 500 }}>
            No shops found
          </h3>
          <p className="empty-state-text" style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" aria-label="Shops list">
            <thead>
              <tr>
                <th scope="col" style={{ width: "80px" }}>Logo</th>
                <th scope="col">Shop Name</th>
                <th scope="col">Slug</th>
                <th scope="col">Tagline / Description</th>
                <th scope="col" style={{ textAlign: "center", width: "100px" }}>Featured</th>
                <th scope="col" style={{ textAlign: "center", width: "100px" }}>Status</th>
                <th scope="col" style={{ textAlign: "right", width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map((shop) => (
                <tr key={shop.id} className="admin-table-row">
                  <td className="admin-table-cell">
                    <div
                      style={{
                        position: "relative",
                        width: "48px",
                        height: "48px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        backgroundColor: "var(--color-surface-container-low, #eee)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shop.brandImage}
                        alt={`${shop.name} logo`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  </td>
                  <td className="admin-table-cell" style={{ fontWeight: 500 }}>
                    {shop.name}
                  </td>
                  <td className="admin-table-cell">
                    <code
                      style={{
                        fontSize: "12px",
                        background: "var(--color-surface-container-low, #eee)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {shop.slug}
                    </code>
                  </td>
                  <td className="admin-table-cell">
                    <div style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: 500, display: "block", fontSize: "13px" }}>
                        {shop.tagline || "(No tagline)"}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {shop.description}
                      </span>
                    </div>
                  </td>
                  <td className="admin-table-cell" style={{ textAlign: "center" }}>
                    <button
                      onClick={() => handleToggleFeatured(shop)}
                      disabled={actionLoadingId === shop.id}
                      style={{
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: shop.isFeatured ? "var(--color-warning, #D97706)" : "#bbb",
                        fontSize: "20px",
                        outline: "none",
                      }}
                      title={shop.isFeatured ? "Unfeature Shop" : "Feature Shop"}
                    >
                      ★
                    </button>
                  </td>
                  <td className="admin-table-cell" style={{ textAlign: "center" }}>
                    <button
                      onClick={() => handleToggleActive(shop)}
                      disabled={actionLoadingId === shop.id}
                      className={`btn btn-sm ${shop.isActive ? "btn-outline" : "btn-danger"}`}
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        minWidth: "75px",
                        textAlign: "center",
                      }}
                    >
                      {shop.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="admin-table-cell" style={{ textAlign: "right" }}>
                    <LinkNext
                      href={`/admin/shops/${shop.id}/edit`}
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: "12px" }}
                    >
                      Edit
                    </LinkNext>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
