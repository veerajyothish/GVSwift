"use client";

/**
 * OrderDetailClient — Client component for order detail rendering.
 *
 * TICKET-302: Renders order items, status timeline, tracking reference,
 * and cancel/return action buttons. Cancel and return flows are stubbed
 * (will be wired in TICKET-303 and TICKET-304).
 */

import React from "react";
import Link from "next/link";

/* ── Types ──────────────────────────────────────────────────────────────── */

interface OrderItem {
  id: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
  productName: string;
  productSlug: string;
  productImage: string | null;
  variantSku: string | null;
  variantAttributes: number | null;
}

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  changedById: string | null;
  createdAt: string;
}

interface Address {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface SerializedOrder {
  id: string;
  status: string;
  paymentMethod: string;
  subtotalPaise: number;
  shippingPaise: number;
  codFeePaise: number;
  totalPaise: number;
  trackingReference: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
  address: Address;
}

interface OrderDetailClientProps {
  order: SerializedOrder;
  canCancel: boolean;
  canReturn: boolean;
  returnWindowDays: number;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; colorVar: string }> = {
  PLACED: { label: "Order Placed", colorVar: "var(--color-info)" },
  CONFIRMED: { label: "Confirmed", colorVar: "var(--color-info)" },
  SHIPPED: { label: "Shipped", colorVar: "var(--color-accent)" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", colorVar: "var(--color-accent)" },
  DELIVERED: { label: "Delivered", colorVar: "var(--color-success)" },
  CANCELLED: { label: "Cancelled", colorVar: "var(--color-error)" },
  FAILED_DELIVERY: { label: "Failed Delivery", colorVar: "var(--color-warning)" },
  RTO: { label: "Returned to Origin", colorVar: "var(--color-error)" },
  RETURN_REQUESTED: { label: "Return Requested", colorVar: "var(--color-warning)" },
  RETURNED: { label: "Returned", colorVar: "var(--color-text-secondary)" },
};

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function OrderDetailClient({
  order,
  canCancel,
  canReturn,
  returnWindowDays,
}: OrderDetailClientProps) {
  const statusCfg = STATUS_CONFIG[order.status] ?? {
    label: order.status,
    colorVar: "var(--color-text-secondary)",
  };

  return (
    <div className="order-detail">
      {/* Breadcrumb */}
      <nav className="order-breadcrumb" aria-label="Breadcrumb">
        <Link href="/orders" className="order-breadcrumb-link">
          My Orders
        </Link>
        <span className="order-breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span className="order-breadcrumb-current">Order Details</span>
      </nav>

      {/* Header */}
      <div className="order-detail-header">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--color-text-primary)", marginBottom: "8px" }}
          >
            Order Details
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Placed on {formatDate(order.createdAt)} · Order ID:{" "}
            <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
              {order.id.slice(0, 8)}…
            </span>
          </p>
        </div>

        <span
          className="order-status-badge order-status-badge-lg"
          style={{
            backgroundColor: `color-mix(in srgb, ${statusCfg.colorVar} 15%, transparent)`,
            color: statusCfg.colorVar,
            borderColor: `color-mix(in srgb, ${statusCfg.colorVar} 25%, transparent)`,
          }}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Two-column layout on desktop */}
      <div className="order-detail-grid">
        {/* Left column: items + summary */}
        <div className="order-detail-main">
          {/* Order Items */}
          <section className="card" style={{ marginBottom: "24px" }}>
            <div className="order-section-header">
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Items ({order.items.length})
              </h2>
            </div>

            <div className="order-items-list">
              {order.items.map((item) => (
                <div key={item.id} className="order-item-row">
                  {/* Thumbnail */}
                  <div className="order-item-thumb">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-md)" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "var(--color-bg)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--color-text-secondary)",
                          fontSize: "20px",
                        }}
                      >
                        📦
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="order-item-details">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="order-item-name"
                    >
                      {item.productName}
                    </Link>
                    {item.variantSku && (
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)", marginTop: "2px" }}>
                        SKU: {item.variantSku}
                      </p>
                    )}
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)", marginTop: "4px" }}>
                      Qty: {item.quantity} × {formatPaise(item.unitPricePaise)}
                    </p>
                  </div>

                  {/* Line total */}
                  <div className="order-item-price">
                    <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {formatPaise(item.lineTotalPaise)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="order-summary-section">
              <div className="order-summary-row">
                <span style={{ color: "var(--color-text-secondary)" }}>Subtotal</span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {formatPaise(order.subtotalPaise)}
                </span>
              </div>
              <div className="order-summary-row">
                <span style={{ color: "var(--color-text-secondary)" }}>Shipping</span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {order.shippingPaise === 0 ? "Free" : formatPaise(order.shippingPaise)}
                </span>
              </div>
              {order.codFeePaise > 0 && (
                <div className="order-summary-row">
                  <span style={{ color: "var(--color-text-secondary)" }}>COD Fee</span>
                  <span style={{ color: "var(--color-text-primary)" }}>
                    {formatPaise(order.codFeePaise)}
                  </span>
                </div>
              )}
              <div
                className="order-summary-row order-summary-total"
                style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px", marginTop: "8px" }}
              >
                <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  Total
                </span>
                <span className="font-bold text-lg" style={{ color: "var(--color-accent)" }}>
                  {formatPaise(order.totalPaise)}
                </span>
              </div>
              <div className="order-summary-row" style={{ marginTop: "4px" }}>
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Payment Method
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right column: timeline + address + actions */}
        <div className="order-detail-sidebar">
          {/* Tracking Reference */}
          {order.trackingReference && (
            <section className="card" style={{ marginBottom: "24px", padding: "20px" }}>
              <h3
                className="font-semibold"
                style={{ color: "var(--color-text-primary)", fontSize: "15px", marginBottom: "12px" }}
              >
                📋 Tracking Reference
              </h3>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "14px",
                  color: "var(--color-accent)",
                  padding: "10px 14px",
                  backgroundColor: "var(--color-bg)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  wordBreak: "break-all",
                }}
              >
                {order.trackingReference}
              </p>
              <p
                className="text-xs"
                style={{
                  color: "var(--color-text-secondary)",
                  marginTop: "8px",
                  lineHeight: "1.5",
                }}
              >
                This is a manually-entered reference, not live courier tracking.
                Contact support if you need delivery status updates.
              </p>
            </section>
          )}

          {/* Status Timeline */}
          <section className="card" style={{ marginBottom: "24px", padding: "20px" }}>
            <h3
              className="font-semibold"
              style={{ color: "var(--color-text-primary)", fontSize: "15px", marginBottom: "16px" }}
            >
              Status Timeline
            </h3>

            <div className="order-timeline">
              {order.statusHistory.map((entry, idx) => {
                const entryCfg = STATUS_CONFIG[entry.toStatus] ?? {
                  label: entry.toStatus,
                  colorVar: "var(--color-text-secondary)",
                };
                const isLast = idx === order.statusHistory.length - 1;

                return (
                  <div key={entry.id} className="order-timeline-entry">
                    {/* Timeline dot + line */}
                    <div className="order-timeline-marker">
                      <div
                        className="order-timeline-dot"
                        style={{
                          backgroundColor: isLast ? entryCfg.colorVar : "var(--color-border)",
                          boxShadow: isLast
                            ? `0 0 0 4px color-mix(in srgb, ${entryCfg.colorVar} 20%, transparent)`
                            : "none",
                        }}
                      />
                      {!isLast && <div className="order-timeline-line" />}
                    </div>

                    {/* Content */}
                    <div className="order-timeline-content">
                      <p
                        className="font-medium"
                        style={{
                          color: isLast ? entryCfg.colorVar : "var(--color-text-primary)",
                          fontSize: "14px",
                        }}
                      >
                        {entryCfg.label}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)", marginTop: "2px" }}>
                        {formatDateTime(entry.createdAt)}
                        {entry.changedById === null && " · System"}
                      </p>
                      {entry.reason && (
                        <p
                          className="text-xs"
                          style={{
                            color: "var(--color-text-secondary)",
                            marginTop: "4px",
                            fontStyle: "italic",
                          }}
                        >
                          {entry.reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Shipping Address */}
          <section className="card" style={{ marginBottom: "24px", padding: "20px" }}>
            <h3
              className="font-semibold"
              style={{ color: "var(--color-text-primary)", fontSize: "15px", marginBottom: "12px" }}
            >
              Shipping Address
            </h3>
            <div className="text-sm" style={{ color: "var(--color-text-secondary)", lineHeight: "1.7" }}>
              <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                {order.address.fullName}
              </p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>
                {order.address.city}, {order.address.state} — {order.address.pincode}
              </p>
              <p style={{ marginTop: "4px" }}>📞 {order.address.phone}</p>
            </div>
          </section>

          {/* Action Buttons */}
          {(canCancel || canReturn) && (
            <section className="order-actions-section">
              {canCancel && (
                <button
                  className="btn btn-danger w-full"
                  disabled
                  title="Cancellation flow coming soon (TICKET-303)"
                  id="cancel-order-btn"
                >
                  Cancel Order
                  <span className="order-coming-soon-tag">Coming Soon</span>
                </button>
              )}
              {canReturn && (
                <button
                  className="btn btn-secondary w-full"
                  disabled
                  title={`Return flow coming soon (TICKET-304). Return window: ${returnWindowDays} days from delivery.`}
                  id="return-order-btn"
                >
                  Request Return
                  <span className="order-coming-soon-tag">Coming Soon</span>
                </button>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
