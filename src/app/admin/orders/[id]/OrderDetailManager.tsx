"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { downloadInvoicePdf } from "@/lib/invoice";

interface OrderItem {
  id: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
  productName: string;
  productSlug: string;
  productImage: string | null;
  variantSku: string | null;
}

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  changedByEmail: string | null;
  changedByRole: string | null;
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

interface RiskFlag {
  id: string;
  entityType: string;
  entityValue: string;
  riskLevel: string;
  createdAt: string;
}

interface SerializedOrder {
  id: string;
  userId: string;
  status: string;
  paymentMethod: string;
  subtotalPaise: number;
  shippingPaise: number;
  codFeePaise: number;
  totalPaise: number;
  trackingReference: string | null;
  deliveryAttempts: number;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    email: string;
    phone: string | null;
    riskStatus: string;
  };
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
  address: Address;
  riskFlags: RiskFlag[];
}

interface OrderDetailManagerProps {
  order: SerializedOrder;
  maxDeliveryAttempts: number;
}

const STATUS_CONFIG: Record<string, { label: string; colorVar: string }> = {
  PLACED: { label: "Placed", colorVar: "var(--color-info)" },
  CONFIRMED: { label: "Confirmed", colorVar: "var(--color-info)" },
  SHIPPED: { label: "Shipped", colorVar: "var(--color-accent)" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", colorVar: "var(--color-accent)" },
  DELIVERED: { label: "Delivered", colorVar: "var(--color-success)" },
  CANCELLED: { label: "Cancelled", colorVar: "var(--color-error)" },
  FAILED_DELIVERY: { label: "Failed Delivery", colorVar: "var(--color-warning)" },
  RTO: { label: "Returned to Origin (RTO)", colorVar: "var(--color-error)" },
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
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailManager({
  order,
  maxDeliveryAttempts,
}: OrderDetailManagerProps) {
  const router = useRouter();

  // Field updates states
  const [internalNotes, setInternalNotes] = useState(order.internalNotes ?? "");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [trackingRef, setTrackingRef] = useState(order.trackingReference ?? "");
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [trackingSuccess, setTrackingSuccess] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Transition states
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  
  // Prompt modal for cancellation overrides
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideTargetStatus, setOverrideTargetStatus] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Surface auto-cancelled stock check
  const [autoCancelledStock, setAutoCancelledStock] = useState(false);

  // Determine valid transitions for ADMIN
  const getValidTransitions = (status: string): string[] => {
    switch (status) {
      case "PLACED":
        return ["CONFIRMED", "CANCELLED"];
      case "CONFIRMED":
        return ["SHIPPED", "CANCELLED"];
      case "SHIPPED":
        return ["OUT_FOR_DELIVERY", "CANCELLED"]; // CANCELLED is override
      case "OUT_FOR_DELIVERY":
        return ["DELIVERED", "FAILED_DELIVERY", "CANCELLED"]; // CANCELLED is override
      case "FAILED_DELIVERY": {
        const next: string[] = ["CANCELLED"]; // CANCELLED is override
        if (order.deliveryAttempts < maxDeliveryAttempts) {
          next.push("OUT_FOR_DELIVERY");
        } else {
          next.push("RTO");
        }
        return next;
      }
      case "DELIVERED":
        return ["RETURN_REQUESTED"];
      case "RETURN_REQUESTED":
        return ["RETURNED", "DELIVERED"]; // DELIVERED is reject return request
      default:
        return [];
    }
  };

  const validNextStatuses = getValidTransitions(order.status);

  // Handle regular status change or trigger override modal
  const handleTransitionClick = (toStatus: string) => {
    // Check if it's a post-shipped cancellation override
    const isOverride =
      toStatus === "CANCELLED" &&
      (order.status === "SHIPPED" ||
        order.status === "OUT_FOR_DELIVERY" ||
        order.status === "FAILED_DELIVERY");

    if (isOverride) {
      setOverrideTargetStatus(toStatus);
      setOverrideReason("");
      setOverrideError(null);
      setShowOverrideModal(true);
    } else {
      executeTransition(toStatus, null);
    }
  };

  const executeTransition = async (toStatus: string, reason: string | null) => {
    setTransitionLoading(true);
    setTransitionError(null);
    setAutoCancelledStock(false);

    try {
      const res = await fetch(`/api/v1/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus, reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTransitionError(data.error || "Failed to update order status.");
        setTransitionLoading(false);
        return;
      }

      // Check if PLACED -> CONFIRMED auto-cancelled due to stock
      if (toStatus === "CONFIRMED" && data.order?.status === "CANCELLED") {
        setAutoCancelledStock(true);
        setTransitionError("Insufficent variant stock available. The order has been automatically cancelled.");
      }

      // Refresh order data
      router.refresh();
    } catch {
      setTransitionError("Network error. Please try again.");
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleOverrideSubmit = () => {
    const trimmed = overrideReason.trim();
    if (!trimmed) {
      setOverrideError("Please provide an override reason.");
      return;
    }
    if (trimmed.length > 500) {
      setOverrideError("Reason must be under 500 characters.");
      return;
    }

    setShowOverrideModal(false);
    if (overrideTargetStatus) {
      executeTransition(overrideTargetStatus, trimmed);
    }
  };

  // Handle Internal Notes save
  const handleSaveNotes = async () => {
    setNotesSaving(true);
    setNotesSuccess(false);
    setNotesError(null);

    try {
      const res = await fetch(`/api/v1/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotesError(data.error || "Failed to save internal notes.");
        return;
      }

      setNotesSuccess(true);
      router.refresh();
    } catch {
      setNotesError("Network error saving notes.");
    } finally {
      setNotesSaving(false);
    }
  };

  // Handle Tracking Reference save
  const handleSaveTracking = async () => {
    setTrackingSaving(true);
    setTrackingSuccess(false);
    setTrackingError(null);

    try {
      const res = await fetch(`/api/v1/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingReference: trackingRef }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTrackingError(data.error || "Failed to save tracking reference.");
        return;
      }

      setTrackingSuccess(true);
      router.refresh();
    } catch {
      setTrackingError("Network error saving tracking reference.");
    } finally {
      setTrackingSaving(false);
    }
  };

  const currentStatusCfg = STATUS_CONFIG[order.status] ?? {
    label: order.status,
    colorVar: "var(--color-text-secondary)",
  };

  // Check if order has reached shipped or later
  const hasReachedShipped = [
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "FAILED_DELIVERY",
    "RTO",
    "RETURN_REQUESTED",
    "RETURNED",
  ].includes(order.status);

  return (
    <div className="order-detail">
      {/* Breadcrumb */}
      <nav className="order-breadcrumb" aria-label="Breadcrumb">
        <Link href="/admin/orders" className="order-breadcrumb-link">
          Admin Orders
        </Link>
        <span className="order-breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span className="order-breadcrumb-current">Order Management</span>
      </nav>

      {/* Header */}
      <div className="order-detail-header mb-24">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-8">
            Manage Order
          </h1>
          <p className="text-sm text-secondary">
            ID: <span className="text-xs-mono">{order.id}</span>
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => downloadInvoicePdf({
              ...order,
              customerEmail: order.customer.email
            })}
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
              backgroundColor: `color-mix(in srgb, ${currentStatusCfg.colorVar} 15%, transparent)`,
              color: currentStatusCfg.colorVar,
              borderColor: `color-mix(in srgb, ${currentStatusCfg.colorVar} 25%, transparent)`,
            }}
          >
            {currentStatusCfg.label}
          </span>
        </div>
      </div>

      {/* Alert Banners */}
      {transitionError && (
        <div className="alert-banner alert-error mb-24">
          <span>⚠</span>
          <div>
            <strong>Action Failed</strong>
            <p className="mt-4 text-xs">{transitionError}</p>
          </div>
        </div>
      )}

      {autoCancelledStock && (
        <div className="alert-banner alert-warning mb-24">
          <span>ℹ</span>
          <div>
            <strong>Oversold Auto-Cancellation</strong>
            <p className="mt-4 text-xs">
              Order confirmation was automatically cancelled due to insufficient variant inventory. The variant stock has been restored.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="order-detail-grid">
        {/* Left column */}
        <div className="order-detail-main">
          {/* Order Items */}
          <section className="card mb-24">
            <h2 className="text-lg font-semibold text-primary" style={{ padding: "16px 20px 0" }}>
              Items ({order.items.length})
            </h2>

            <div className="order-items-list" style={{ padding: "0 20px 20px" }}>
              {order.items.map((item) => (
                <div key={item.id} className="order-item-row" style={{ padding: "16px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div className="order-item-thumb relative">
                    {item.productImage ? (
                      <Image src={item.productImage} alt={item.productName} className="w-full h-full object-cover rounded-md" fill sizes="(max-width: 640px) 48px, 60px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-default rounded-md text-secondary text-xl">📦</div>
                    )}
                  </div>

                  <div className="order-item-details">
                    <span className="order-item-name">{item.productName}</span>
                    {item.variantSku && (
                      <p className="text-xs text-secondary mt-2">
                        SKU: {item.variantSku}
                      </p>
                    )}
                    <p className="text-sm text-secondary mt-4">
                      Qty: {item.quantity} × {formatPaise(item.unitPricePaise)}
                    </p>
                  </div>

                  <div className="order-item-price">
                    <span className="font-semibold text-primary">
                      {formatPaise(item.lineTotalPaise)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="order-summary-section">
              <div className="order-summary-row">
                <span className="text-secondary">Subtotal</span>
                <span className="text-primary">{formatPaise(order.subtotalPaise)}</span>
              </div>
              <div className="order-summary-row">
                <span className="text-secondary">Shipping</span>
                <span className="text-primary">{order.shippingPaise === 0 ? "Free" : formatPaise(order.shippingPaise)}</span>
              </div>
              {order.codFeePaise > 0 && (
                <div className="order-summary-row">
                  <span className="text-secondary">COD Fee</span>
                  <span className="text-primary">{formatPaise(order.codFeePaise)}</span>
                </div>
              )}
              <div className="order-summary-row order-summary-total">
                <span className="font-semibold text-primary">Total</span>
                <span className="font-bold text-lg text-accent">{formatPaise(order.totalPaise)}</span>
              </div>
            </div>
          </section>

          {/* Risk Flags Section */}
          <section className="card p-5 mb-24">
            <h3 className="font-semibold text-primary text-base mb-16">
              🛡️ Fraud & Risk Assessment
            </h3>

            {order.riskFlags.length === 0 ? (
              <p className="text-sm text-secondary">
                No risk flags exist for this customer, phone number, or pincode.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {order.riskFlags.map((flag) => {
                  let alertClass = "alert-success";
                  if (flag.riskLevel === "MEDIUM") alertClass = "alert-warning";
                  if (flag.riskLevel === "HIGH" || flag.riskLevel === "BLOCKED") alertClass = "alert-error";

                  return (
                    <div
                      key={flag.id}
                      className={`alert-banner mb-0 ${alertClass}`}
                      style={{ padding: "10px 14px" }}
                    >
                      <span className="text-base">🛡️</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <strong>
                            {flag.entityType}: {flag.entityValue}
                          </strong>
                          <span className="font-bold">Level: {flag.riskLevel}</span>
                        </div>
                        <p className="text-xs mt-2 text-secondary">
                          Flagged on {formatDateTime(flag.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Customer Address Details */}
          <section className="card p-5">
            <h3 className="font-semibold text-primary text-base mb-12">
              📍 Shipping Details
            </h3>
            <div className="text-sm text-secondary lh-1-7">
              <p className="font-medium text-primary">{order.address.fullName}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
              <p className="mt-4">📞 {order.address.phone}</p>
              <p className="mt-4">✉️ {order.customer.email}</p>
              <p className="mt-4">👤 Risk Status: <strong>{order.customer.riskStatus}</strong></p>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="order-detail-sidebar">
          {/* Status Transitions Control Panel */}
          <section className="card p-5 mb-24">
            <h3 className="font-semibold text-primary text-15 mb-16">
              Status Controls
            </h3>

            {validNextStatuses.length === 0 ? (
              <p className="text-sm text-secondary">
                No further transitions are possible for this order.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {validNextStatuses.map((nextStatus) => {
                  const cfg = STATUS_CONFIG[nextStatus] ?? { label: nextStatus, colorVar: "var(--color-text-secondary)" };
                  const isCancel = nextStatus === "CANCELLED";

                  return (
                    <button
                      key={nextStatus}
                      className={`btn w-full ${isCancel ? "btn-danger" : "btn-primary"}`}
                      style={{
                        backgroundColor: isCancel ? undefined : cfg.colorVar,
                        color: isCancel ? undefined : "var(--color-bg)",
                        borderColor: isCancel ? undefined : cfg.colorVar,
                        fontSize: "13px",
                      }}
                      disabled={transitionLoading}
                      onClick={() => handleTransitionClick(nextStatus)}
                    >
                      Move to {cfg.label}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Delivery Attempt Tracker */}
          <section className="card p-5 mb-24">
            <h3 className="font-semibold text-primary text-15 mb-12">
              🚚 Delivery Attempts
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Attempts Recorded:</span>
              <span className="font-bold text-lg" style={{ color: order.deliveryAttempts >= maxDeliveryAttempts ? "var(--color-error)" : "var(--color-text-primary)" }}>
                {order.deliveryAttempts} / {maxDeliveryAttempts}
              </span>
            </div>
          </section>

          {/* Internal Notes */}
          <section className="card p-5 mb-24">
            <h3 className="font-semibold text-primary text-15 mb-12">
              📝 Internal Notes
            </h3>

            <div className="input-group margin-0">
              <textarea
                className="input-field"
                placeholder="Type administrative internal notes here..."
                value={internalNotes}
                onChange={(e) => {
                  setInternalNotes(e.target.value);
                  if (notesError) setNotesError(null);
                  if (notesSuccess) setNotesSuccess(false);
                }}
                rows={4}
                maxLength={5000}
                disabled={notesSaving}
              />
              <div className="flex justify-between items-center mt-8">
                {notesError && <span className="input-error-msg text-xs">⚠ {notesError}</span>}
                {notesSuccess && <span className="text-success text-xs">✓ Saved successfully</span>}
                <span />
                <button
                  className={`btn btn-secondary ${notesSaving ? "btn-loading" : ""}`}
                  style={{ padding: "6px 12px", minHeight: "30px", fontSize: "12px" }}
                  onClick={handleSaveNotes}
                  disabled={notesSaving || internalNotes.trim() === (order.internalNotes ?? "")}
                >
                  Save Notes
                </button>
              </div>
            </div>
          </section>

          {/* Tracking Reference (if SHIPPED or later) */}
          {hasReachedShipped && (
            <section className="card p-5 mb-24">
              <h3 className="font-semibold text-primary text-15 mb-12">
                📦 Tracking Reference
              </h3>

              <div className="input-group margin-0">
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. BlueDart AWB #123456"
                  value={trackingRef}
                  onChange={(e) => {
                    setTrackingRef(e.target.value);
                    if (trackingError) setTrackingError(null);
                    if (trackingSuccess) setTrackingSuccess(false);
                  }}
                  maxLength={500}
                  disabled={trackingSaving}
                />
                <div className="flex justify-between items-center mt-8">
                  {trackingError && <span className="input-error-msg text-xs">⚠ {trackingError}</span>}
                  {trackingSuccess && <span className="text-success text-xs">✓ Saved successfully</span>}
                  <span />
                  <button
                    className={`btn btn-secondary ${trackingSaving ? "btn-loading" : ""}`}
                    style={{ padding: "6px 12px", minHeight: "30px", fontSize: "12px" }}
                    onClick={handleSaveTracking}
                    disabled={trackingSaving || trackingRef.trim() === (order.trackingReference ?? "")}
                  >
                    Save Tracking
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Chronological Timeline */}
          <section className="card p-5">
            <h3 className="font-semibold text-primary text-15 mb-16">
              Status History Timeline
            </h3>

            <div className="order-timeline">
              {order.statusHistory.map((entry, idx) => {
                const cfg = STATUS_CONFIG[entry.toStatus] ?? { label: entry.toStatus, colorVar: "var(--color-text-secondary)" };
                const isLast = idx === order.statusHistory.length - 1;

                return (
                  <div key={entry.id} className="order-timeline-entry">
                     <div className="order-timeline-marker">
                       <div
                         className="order-timeline-dot"
                         style={{
                           backgroundColor: isLast ? cfg.colorVar : "var(--color-border)",
                           boxShadow: isLast ? `0 0 0 4px color-mix(in srgb, ${cfg.colorVar} 20%, transparent)` : "none",
                         }}
                       />
                       {!isLast && <div className="order-timeline-line" />}
                     </div>

                     <div className="order-timeline-content">
                       <p className="font-medium text-sm" style={{ color: isLast ? cfg.colorVar : "var(--color-text-primary)" }}>
                         {cfg.label}
                       </p>
                       <p className="text-xs text-secondary mt-2">
                         {formatDateTime(entry.createdAt)}
                         {entry.changedByEmail ? ` · ${entry.changedByEmail} (${entry.changedByRole})` : " · System"}
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
        </div>
      </div>

      {/* Override Cancel Reason Modal */}
      {showOverrideModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!transitionLoading) setShowOverrideModal(false);
          }}
        >
          <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="override-modal-title">
            <div className="modal-header">
              <h3 id="override-modal-title" className="modal-title">
                Confirm Admin Cancellation Override
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowOverrideModal(false)}
                disabled={transitionLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="alert-banner alert-warning mb-20">
                <span>⚠</span>
                <div>
                  <strong>Post-Shipped Cancellation Override</strong>
                  <p className="mt-4 text-xs">
                    This order has already been shipped. Cancelling requires a mandatory administrative override reason that will be logged in the audit history.
                  </p>
                </div>
              </div>

              <div className="input-group mb-0">
                <label htmlFor="override-reason" className="input-label input-required">
                  Override Reason
                </label>
                <textarea
                  id="override-reason"
                  className={`input-field ${overrideError ? "input-error" : ""}`}
                  placeholder="Provide details on why this goodwill override is being applied..."
                  value={overrideReason}
                  onChange={(e) => {
                    setOverrideReason(e.target.value);
                    if (overrideError) setOverrideError(null);
                  }}
                  rows={3}
                  maxLength={500}
                  disabled={transitionLoading}
                  autoFocus
                />
                <div className="flex justify-between items-center">
                  {overrideError ? <span className="input-error-msg">⚠ {overrideError}</span> : <span />}
                  <span className="text-xs text-secondary">
                    {overrideReason.length}/500
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowOverrideModal(false)}
                disabled={transitionLoading}
              >
                Go Back
              </button>
              <button
                className="btn btn-danger"
                onClick={handleOverrideSubmit}
                disabled={transitionLoading || !overrideReason.trim()}
                id="confirm-override-btn"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
