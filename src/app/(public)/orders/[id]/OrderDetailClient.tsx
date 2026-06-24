"use client";

/**
 * OrderDetailClient — Client component for order detail rendering.
 *
 * TICKET-302: Renders order items, status timeline, tracking reference.
 * TICKET-303: Real cancel flow with confirmation modal, reason input, and API call.
 * TICKET-304: Return button still stubbed (Coming Soon).
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { downloadInvoicePdf } from "@/lib/invoice";

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
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[order.status] ?? {
    label: order.status,
    colorVar: "var(--color-text-secondary)",
  };

  // Cancel flow state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  async function handleCancelOrder() {
    const trimmed = cancelReason.trim();
    if (!trimmed) {
      setCancelError("Please provide a reason for cancellation.");
      return;
    }
    if (trimmed.length > 500) {
      setCancelError("Reason must be under 500 characters.");
      return;
    }

    setCancelError(null);
    setCancelLoading(true);

    try {
      const res = await fetch(`/api/v1/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCancelError(data.error || "Failed to cancel order. Please try again.");
        setCancelLoading(false);
        return;
      }

      setCancelSuccess(true);
      setCancelLoading(false);

      // Refresh the page to show updated status after a brief moment
      setTimeout(() => {
        router.refresh();
        setShowCancelModal(false);
      }, 1500);
    } catch {
      setCancelError("Network error. Please check your connection and try again.");
      setCancelLoading(false);
    }
  }

  // Return flow state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);

  async function handleReturnOrder() {
    const trimmed = returnReason.trim();
    if (!trimmed) {
      setReturnError("Please provide a reason for the return request.");
      return;
    }
    if (trimmed.length > 500) {
      setReturnError("Reason must be under 500 characters.");
      return;
    }

    setReturnError(null);
    setReturnLoading(true);

    try {
      const res = await fetch(`/api/v1/orders/${order.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setReturnError(data.error || "Failed to request return. Please try again.");
        setReturnLoading(false);
        return;
      }

      setReturnSuccess(true);
      setReturnLoading(false);

      // Refresh the page to show updated status after a brief moment
      setTimeout(() => {
        router.refresh();
        setShowReturnModal(false);
      }, 1500);
    } catch {
      setReturnError("Network error. Please check your connection and try again.");
      setReturnLoading(false);
    }
  }

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
          <h1 className="text-2xl font-semibold text-primary mb-8">
            Order Details
          </h1>
          <p className="text-sm text-secondary">
            Placed on {formatDate(order.createdAt)} · Order ID:{" "}
            <span className="text-xs-mono">
              {order.id.slice(0, 8)}…
            </span>
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => downloadInvoicePdf(order)}
            className="btn btn-secondary"
            id="download-invoice-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              fontSize: "13px",
              minHeight: "34px",
            }}
          >
            📥 Download Invoice
          </button>
          
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
      </div>

      {/* Two-column layout on desktop */}
      <div className="order-detail-grid">
        {/* Left column: items + summary */}
        <div className="order-detail-main">
          {/* Order Items */}
          <section className="card mb-24">
            <div className="order-section-header">
              <h2 className="text-lg font-semibold text-primary">
                Items ({order.items.length})
              </h2>
            </div>

            <div className="order-items-list">
              {order.items.map((item) => (
                <div key={item.id} className="order-item-row">
                  <div className="order-item-thumb relative">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover rounded-md"
                        fill
                        sizes="(max-width: 640px) 48px, 60px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-default rounded-md text-secondary" style={{ fontSize: "20px" }}>
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
                      <p className="text-xs text-secondary mt-2">
                        SKU: {item.variantSku}
                      </p>
                    )}
                    <p className="text-sm text-secondary mt-4">
                      Qty: {item.quantity} × {formatPaise(item.unitPricePaise)}
                    </p>
                  </div>

                  {/* Line total */}
                  <div className="order-item-price">
                    <span className="font-semibold text-primary">
                      {formatPaise(item.lineTotalPaise)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="order-summary-section">
              <div className="order-summary-row">
                <span className="text-secondary">Subtotal</span>
                <span className="text-primary">
                  {formatPaise(order.subtotalPaise)}
                </span>
              </div>
              <div className="order-summary-row">
                <span className="text-secondary">Shipping</span>
                <span className="text-primary">
                  {order.shippingPaise === 0 ? "Free" : formatPaise(order.shippingPaise)}
                </span>
              </div>
              {order.codFeePaise > 0 && (
                <div className="order-summary-row">
                  <span className="text-secondary">COD Fee</span>
                  <span className="text-primary">
                    {formatPaise(order.codFeePaise)}
                  </span>
                </div>
              )}
              <div className="order-summary-row order-summary-total">
                <span className="font-semibold text-primary">
                  Total
                </span>
                <span className="font-bold text-lg text-accent">
                  {formatPaise(order.totalPaise)}
                </span>
              </div>
              <div className="order-summary-row mt-4">
                <span className="text-xs text-secondary">
                  Payment Method
                </span>
                <span className="text-sm font-medium text-primary">
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
            <section className="card order-sidebar-card">
              <h3 className="font-semibold text-primary mb-12 text-15">
                📋 Tracking Reference
              </h3>
              <p className="tracking-reference-code">
                {order.trackingReference}
              </p>
              <p className="text-xs text-secondary mt-8 lh-1-5">
                This is a manually-entered reference, not live courier tracking.
                Contact support if you need delivery status updates.
              </p>
            </section>
          )}

          {/* Status Timeline */}
          <section className="card order-sidebar-card">
            <h3 className="font-semibold text-primary mb-16 text-15">
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
                        className="font-medium text-sm"
                        style={{
                          color: isLast ? entryCfg.colorVar : "var(--color-text-primary)",
                        }}
                      >
                        {entryCfg.label}
                      </p>
                      <p className="text-xs text-secondary mt-2">
                        {formatDateTime(entry.createdAt)}
                        {entry.changedById === null && " · System"}
                      </p>
                      {entry.reason && (
                        <p className="text-xs text-secondary mt-4 italic">
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
          <section className="card order-sidebar-card">
            <h3 className="font-semibold text-primary mb-12 text-15">
              Shipping Address
            </h3>
            <div className="text-sm text-secondary lh-1-7">
              <p className="font-medium text-primary">
                {order.address.fullName}
              </p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>
                {order.address.city}, {order.address.state} — {order.address.pincode}
              </p>
              <p className="mt-4">📞 {order.address.phone}</p>
            </div>
          </section>

          {/* Action Buttons */}
          {(canCancel || canReturn) && (
            <section className="order-actions-section">
              {canCancel && (
                <button
                  className="btn btn-danger w-full"
                  onClick={() => setShowCancelModal(true)}
                  id="cancel-order-btn"
                >
                  Cancel Order
                </button>
              )}
              {canReturn && (
                <button
                  className="btn btn-secondary w-full"
                  onClick={() => setShowReturnModal(true)}
                  id="return-order-btn"
                >
                  Request Return
                </button>
              )}
            </section>
          )}
        </div>
      </div>

      {/* ── Cancel Confirmation Modal ───────────────────────────────────── */}
      {showCancelModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !cancelLoading) {
              setShowCancelModal(false);
              setCancelError(null);
              setCancelReason("");
              setCancelSuccess(false);
            }
          }}
        >
          <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
            <div className="modal-header">
              <h3 id="cancel-modal-title" className="modal-title">
                Cancel Order
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  if (!cancelLoading) {
                    setShowCancelModal(false);
                    setCancelError(null);
                    setCancelReason("");
                    setCancelSuccess(false);
                  }
                }}
                aria-label="Close"
                disabled={cancelLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {cancelSuccess ? (
                <div className="alert-banner alert-success mb-0">
                  <span>✓</span>
                  <div>
                    <strong>Order cancelled successfully.</strong>
                    <p className="mt-4 text-13">
                      Stock has been restored. Redirecting...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="alert-banner alert-warning mb-20">
                    <span>⚠</span>
                    <div>
                      <strong>Are you sure you want to cancel this order?</strong>
                      <p className="mt-4 text-13">
                        This action cannot be undone. The reserved stock will be released.
                      </p>
                    </div>
                  </div>

                  <div className="input-group mb-0">
                    <label htmlFor="cancel-reason" className="input-label input-required">
                      Reason for cancellation
                    </label>
                    <textarea
                      id="cancel-reason"
                      className={`input-field ${cancelError ? "input-error" : ""}`}
                      placeholder="Please tell us why you're cancelling this order..."
                      value={cancelReason}
                      onChange={(e) => {
                        setCancelReason(e.target.value);
                        if (cancelError) setCancelError(null);
                      }}
                      rows={3}
                      maxLength={500}
                      disabled={cancelLoading}
                      autoFocus
                    />
                    <div className="flex justify-between items-center">
                      {cancelError ? (
                        <span className="input-error-msg">⚠ {cancelError}</span>
                      ) : (
                        <span />
                      )}
                      <span className="text-xs text-secondary">
                        {cancelReason.length}/500
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!cancelSuccess && (
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelError(null);
                    setCancelReason("");
                  }}
                  disabled={cancelLoading}
                >
                  Keep Order
                </button>
                <button
                  className={`btn btn-danger ${cancelLoading ? "btn-loading" : ""}`}
                  onClick={handleCancelOrder}
                  disabled={cancelLoading || !cancelReason.trim()}
                  id="confirm-cancel-btn"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Return Confirmation Modal ───────────────────────────────────── */}
      {showReturnModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !returnLoading) {
              setShowReturnModal(false);
              setReturnError(null);
              setReturnReason("");
              setReturnSuccess(false);
            }
          }}
        >
          <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="return-modal-title">
            <div className="modal-header">
              <h3 id="return-modal-title" className="modal-title">
                Request Return
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  if (!returnLoading) {
                    setShowReturnModal(false);
                    setReturnError(null);
                    setReturnReason("");
                    setReturnSuccess(false);
                  }
                }}
                aria-label="Close"
                disabled={returnLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {returnSuccess ? (
                <div className="alert-banner alert-success mb-0">
                  <span>✓</span>
                  <div>
                    <strong>Return request submitted successfully.</strong>
                    <p className="mt-4 text-13">
                      Our support team will review your request. Redirecting...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="alert-banner alert-warning mb-20">
                    <span>⚠</span>
                    <div>
                      <strong>Are you sure you want to request a return?</strong>
                      <p className="mt-4 text-13">
                        Please enter a detailed reason for returning the items. Requests must be within {returnWindowDays} days of delivery.
                      </p>
                    </div>
                  </div>

                  <div className="input-group mb-0">
                    <label htmlFor="return-reason" className="input-label input-required">
                      Reason for return
                    </label>
                    <textarea
                      id="return-reason"
                      className={`input-field ${returnError ? "input-error" : ""}`}
                      placeholder="Please describe why you are requesting a return..."
                      value={returnReason}
                      onChange={(e) => {
                        setReturnReason(e.target.value);
                        if (returnError) setReturnError(null);
                      }}
                      rows={3}
                      maxLength={500}
                      disabled={returnLoading}
                      autoFocus
                    />
                    <div className="flex justify-between items-center">
                      {returnError ? (
                        <span className="input-error-msg">⚠ {returnError}</span>
                      ) : (
                        <span />
                      )}
                      <span className="text-xs text-secondary">
                        {returnReason.length}/500
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!returnSuccess && (
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowReturnModal(false);
                    setReturnError(null);
                    setReturnReason("");
                  }}
                  disabled={returnLoading}
                >
                  Keep Items
                </button>
                <button
                  className={`btn btn-primary ${returnLoading ? "btn-loading" : ""}`}
                  onClick={handleReturnOrder}
                  disabled={returnLoading || !returnReason.trim()}
                  id="confirm-return-btn"
                >
                  Submit Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
