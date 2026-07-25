"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Image from "next/image";
import { useOverlay } from "@/hooks/useOverlay";

// Basic formatting helpers
function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}

interface OrderItem {
  id: string;
  quantity: number;
  lineTotalPaise: number;
  product: { name: string; slug: string; images: { url: string }[] };
  variant: { sku: string };
}

interface Order {
  id: string;
  status: string;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  items: OrderItem[];
  statusHistory: { toStatus: string; createdAt: string }[];
  address: { fullName: string; line1: string; line2: string; city: string; state: string; pincode: string; phone: string };
}

const STATUS_CONFIG: Record<string, { label: string; colorVar: string; bgVar: string }> = {
  PLACED: { label: "Order Placed", colorVar: "#fff", bgVar: "var(--color-warning)" },
  CONFIRMED: { label: "Confirmed", colorVar: "#fff", bgVar: "var(--color-warning)" },
  SHIPPED: { label: "Shipped", colorVar: "#fff", bgVar: "var(--color-accent)" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", colorVar: "#fff", bgVar: "var(--color-accent)" },
  DELIVERED: { label: "Delivered", colorVar: "#fff", bgVar: "var(--color-success)" },
  CANCELLED: { label: "Cancelled", colorVar: "#fff", bgVar: "var(--color-error)" },
  FAILED_DELIVERY: { label: "Failed Delivery", colorVar: "#fff", bgVar: "var(--color-error)" },
  RTO: { label: "Returned to Origin", colorVar: "#fff", bgVar: "var(--color-error)" },
  RETURN_REQUESTED: { label: "Return Requested", colorVar: "#fff", bgVar: "var(--color-warning)" },
  RETURNED: { label: "Returned", colorVar: "#fff", bgVar: "var(--color-text-secondary)" },
};

export function OrderTrackingOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  
  // Cancel/Return modals could be local state here if needed, but for the tracking overlay we'll keep it simple first
  const [activeTab, setActiveTab] = useState<"items" | "timeline">("timeline");

  const panelRef = useRef<HTMLDivElement>(null);
  const closeOverlay = useCallback(() => {
    setIsOpen(false);
    setOrder(null);
  }, []);
  useOverlay(isOpen, closeOverlay, panelRef);

  useEffect(() => {
    setMounted(true);

    const handleOpen = async (e: Event) => {
      const orderId = (e as CustomEvent).detail?.orderId;
      if (!orderId) return;

      setIsOpen(true);
      setLoading(true);
      setActiveTab("timeline");

      try {
        const res = await fetch(`/api/v1/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener("gvswift-open-order-tracking", handleOpen);
    return () => window.removeEventListener("gvswift-open-order-tracking", handleOpen);
  }, []);



  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease-out forwards",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={closeOverlay}
      aria-labelledby="ordertracking-heading"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}} />
      <div
        ref={panelRef}
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "100%",
          background: "var(--color-bg)",
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 id="ordertracking-heading" style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "20px", color: "var(--color-primary)" }}>
              Order Details
            </h2>
            {order && (
              <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "4px", fontFamily: "monospace" }}>
                #GVS-{order.id.slice(0, 8).toUpperCase()}
              </p>
            )}
          </div>
          <button
            onClick={closeOverlay}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-primary)",
            }}
            aria-label="Close"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", background: "var(--color-surface)" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-secondary)" }}>
              Loading order details...
            </div>
          ) : order ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
                {[
                  { id: "timeline" as const, label: "Tracking" },
                  { id: "items" as const, label: "Items & Total" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: "16px 12px",
                      background: "none",
                      border: "none",
                      borderBottom: activeTab === tab.id ? "2px solid var(--color-accent)" : "2px solid transparent",
                      fontWeight: activeTab === tab.id ? 600 : 400,
                      color: activeTab === tab.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                      cursor: "pointer",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "32px" }}>
                {activeTab === "timeline" && (
                  <>
                    {/* Status Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>Current Status</span>
                      <span style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: STATUS_CONFIG[order.status]?.colorVar || "#fff",
                        background: STATUS_CONFIG[order.status]?.bgVar || "var(--color-text-secondary)",
                        letterSpacing: "0.05em"
                      }}>
                        {STATUS_CONFIG[order.status]?.label || order.status}
                      </span>
                    </div>

                    {/* Timeline */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {["PLACED", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].map((step, idx, arr) => {
                        const historyEntry = order.statusHistory.find((h) => h.toStatus === step);
                        const isCompleted = !!historyEntry;
                        const isCurrent = order.status === step;
                        
                        return (
                          <div key={step} style={{ display: "flex", gap: "16px", position: "relative" }}>
                            {/* Line connecting steps */}
                            {idx < arr.length - 1 && (
                              <div style={{
                                position: "absolute",
                                left: "11px",
                                top: "24px",
                                bottom: "-20px",
                                width: "2px",
                                background: isCompleted ? "var(--color-accent)" : "var(--color-border)",
                                zIndex: 0
                              }} />
                            )}
                            
                            {/* Dot */}
                            <div style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: isCompleted ? "var(--color-accent)" : "var(--color-bg)",
                              border: isCompleted ? "none" : "2px solid var(--color-border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              zIndex: 1,
                              flexShrink: 0
                            }}>
                              {isCompleted && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                            
                            {/* Text */}
                            <div style={{ paddingTop: "2px" }}>
                              <p style={{ 
                                margin: 0, 
                                fontSize: "14px", 
                                fontWeight: isCurrent ? 600 : 500,
                                color: isCompleted ? "var(--color-text-primary)" : "var(--color-text-secondary)"
                              }}>
                                {STATUS_CONFIG[step]?.label || step}
                              </p>
                              {isCompleted && (
                                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                                  {formatDateTime(historyEntry.createdAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {activeTab === "items" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Items */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {order.items.map((item) => (
                        <div key={item.id} style={{ display: "flex", gap: "16px", padding: "16px", background: "var(--color-bg)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
                          <div style={{ width: "64px", height: "64px", position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--color-surface)", flexShrink: 0 }}>
                            {item.product?.images?.[0]?.url ? (
                              <Image src={item.product.images[0].url} alt={item.product.name} fill sizes="64px" style={{ objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>📦</div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.product?.name || "Unknown Product"}
                            </p>
                            <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                              Qty: {item.quantity} | Size: {item.variant?.sku?.split('-')?.pop() || 'N/A'}
                            </p>
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>
                              {formatPaise(item.lineTotalPaise)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div style={{ background: "var(--color-bg)", borderRadius: "var(--radius-lg)", padding: "20px", border: "1px solid var(--color-border)" }}>
                      <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontFamily: "var(--font-heading)" }}>Order Summary</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>Subtotal</span>
                          <span>{formatPaise(order.subtotalPaise)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>Shipping</span>
                          <span>{order.shippingPaise === 0 ? "Free" : formatPaise(order.shippingPaise)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--color-border)", fontWeight: 600, fontSize: "15px" }}>
                          <span>Total</span>
                          <span>{formatPaise(order.totalPaise)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {order.address && (
                      <div style={{ background: "var(--color-bg)", borderRadius: "var(--radius-lg)", padding: "20px", border: "1px solid var(--color-border)" }}>
                        <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontFamily: "var(--font-heading)" }}>Delivery Address</h3>
                        <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                          <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-primary)" }}>{order.address.fullName}</p>
                          <p style={{ margin: 0 }}>{order.address.line1}</p>
                          {order.address.line2 && <p style={{ margin: 0 }}>{order.address.line2}</p>}
                          <p style={{ margin: 0 }}>{order.address.city}, {order.address.state} {order.address.pincode}</p>
                          <p style={{ margin: "8px 0 0 0" }}>{order.address.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-secondary)" }}>
              Failed to load order details.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
