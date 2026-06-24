"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CouponActionsCell({
  id,
  code,
  isActive,
}: {
  id: string;
  code: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to update coupon.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to delete coupon.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
      {error && (
        <span style={{ color: "var(--color-error)", fontSize: "12px", alignSelf: "center" }}>{error}</span>
      )}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={isActive ? "btn btn-sm btn-secondary" : "btn btn-sm btn-primary"}
        id={`toggle-coupon-${id}`}
      >
        {loading ? "…" : isActive ? "Deactivate" : "Activate"}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="btn btn-sm btn-danger"
        id={`delete-coupon-${id}`}
      >
        Delete
      </button>
    </div>
  );
}
