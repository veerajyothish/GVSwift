"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCouponPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderRupees, setMinOrderRupees] = useState<number>(0);
  const [maxUsage, setMaxUsage] = useState<number>(0);
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError("Coupon code is required."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue,
          minOrderPaise: Math.round(minOrderRupees * 100),
          maxUsage,
          validFrom: validFrom || null,
          validUntil: validUntil || null,
          isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create coupon."); return; }
      router.push("/admin/coupons");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">New Coupon</h1>
          <p className="admin-page-subtitle">Create a discount code for your customers.</p>
        </div>
      </div>

      <div style={{ maxWidth: "640px" }}>
        <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-5">
          {/* Code */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="coupon-code" className="admin-settings-label">
              Coupon Code <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <input
              id="coupon-code"
              type="text"
              className="input-field"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SAVE20"
              required
            />
            <span className="admin-settings-help">Will be stored in uppercase.</span>
          </div>

          {/* Type + Value */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="discount-type" className="admin-settings-label">Discount Type</label>
              <select
                id="discount-type"
                className="input-field"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="discount-value" className="admin-settings-label">
                {discountType === "PERCENTAGE" ? "Discount %" : "Discount ₹"}
              </label>
              <input
                id="discount-value"
                type="number"
                className="input-field"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                min="1"
                max={discountType === "PERCENTAGE" ? 100 : undefined}
                required
              />
            </div>
          </div>

          {/* Min order + Max usage */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="min-order" className="admin-settings-label">Min Order (₹)</label>
              <input
                id="min-order"
                type="number"
                className="input-field"
                value={minOrderRupees}
                onChange={(e) => setMinOrderRupees(Number(e.target.value))}
                min="0"
              />
              <span className="admin-settings-help">0 = no minimum</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="max-usage" className="admin-settings-label">Max Usage</label>
              <input
                id="max-usage"
                type="number"
                className="input-field"
                value={maxUsage}
                onChange={(e) => setMaxUsage(Number(e.target.value))}
                min="0"
              />
              <span className="admin-settings-help">0 = unlimited</span>
            </div>
          </div>

          {/* Valid from / until */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="valid-from" className="admin-settings-label">Valid From (optional)</label>
              <input
                id="valid-from"
                type="date"
                className="input-field"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="valid-until" className="admin-settings-label">Valid Until (optional)</label>
              <input
                id="valid-until"
                type="date"
                className="input-field"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              id="is-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--color-accent)" }}
            />
            <label htmlFor="is-active" className="admin-settings-label" style={{ cursor: "pointer" }}>
              Active (customers can apply this coupon immediately)
            </label>
          </div>

          {error && (
            <div style={{ background: "var(--color-error-bg)", border: "1px solid var(--color-error)", borderRadius: "var(--radius-md)", padding: "10px 14px", color: "var(--color-error)", fontSize: "13px", fontWeight: 500 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.push("/admin/coupons")} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
