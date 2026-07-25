"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { mapProductToGa4Item } from "@/lib/analytics/ecommerce";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { useOverlay } from "@/hooks/useOverlay";

// Matches Prisma schema query output (same as CartPageClient)
interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    name: string;
    slug: string;
    basePricePaise: number;
    images?: Array<{
      url: string;
      altText: string | null;
      isPrimary: boolean;
    }>;
  };
  variant: {
    sku: string;
    stock: number;
    priceDeltaPaise: number;
  } | null;
}

interface Cart {
  id: string;
  items: CartItem[];
}

export function CartOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const { toast } = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeOverlay = useCallback(() => setIsOpen(false), []);
  useOverlay(isOpen, closeOverlay, panelRef);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/cart");
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    
    const handleOpen = () => {
      setIsOpen(true);
      fetchCart();
    };

    window.addEventListener("gvswift-open-cart", handleOpen);
    return () => window.removeEventListener("gvswift-open-cart", handleOpen);
  }, [fetchCart]);



  if (!mounted || typeof document === "undefined") return null;

  const getCartItems = () => cart?.items || [];
  const getItemPrice = (item: CartItem) => {
    const base = item.product.basePricePaise;
    const delta = item.variant?.priceDeltaPaise ?? 0;
    return base + delta;
  };
  const getSubtotal = () => getCartItems().reduce((total, item) => total + getItemPrice(item) * item.quantity, 0);

  const formatRupees = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(paise / 100);
  };

  const handleQuantityChange = async (itemId: string, newQty: number, stock: number) => {
    if (newQty < 1) return;
    if (newQty > stock) {
      toast.error(`Only ${stock} items available.`, "Out of Stock");
      return;
    }
    setUpdatingItemId(itemId);
    try {
      const res = await fetch(`/api/v1/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      
      setCart((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, quantity: newQty } : item
          ),
        };
      });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Error updating quantity");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItemId(itemId);
    try {
      const res = await fetch(`/api/v1/cart/${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove item");
      
      setCart((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter((item) => item.id !== itemId),
        };
      });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Error removing item");
    } finally {
      setUpdatingItemId(null);
    }
  };

  return createPortal(
    <>
      {isOpen && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "var(--color-bg)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", // We'll handle scrolling internally
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-overlay-heading"
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--color-border)" }}>
            <h2 id="cart-overlay-heading" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "28px", color: "var(--color-accent)", margin: 0, lineHeight: 1 }}>
              Your Cart
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "32px",
                color: "var(--color-text-primary)",
                cursor: "pointer",
                padding: "4px",
                lineHeight: 1,
              }}
              aria-label="Close cart"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>Loading cart...</div>
            ) : getCartItems().length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛒</div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Your cart is empty</h3>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px" }}>
                  Looks like you haven&apos;t added anything yet.
                </p>
                <Button variant="primary" onClick={() => setIsOpen(false)} style={{ padding: "10px 32px" }}>
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px", margin: "0 auto" }}>
                {getCartItems().map((item) => {
                  const itemPrice = getItemPrice(item);
                  const stock = item.variant?.stock ?? 0;
                  const imageObj = item.product.images?.find((img) => img.isPrimary) || item.product.images?.[0];
                  const imageUrl = imageObj?.url || "/fashion_product_mockup.png";

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        gap: "16px",
                        padding: "16px",
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        opacity: updatingItemId === item.id ? 0.7 : 1,
                        position: "relative"
                      }}
                    >
                      <div style={{ position: "relative", width: "80px", height: "100px", flexShrink: 0, borderRadius: "4px", overflow: "hidden", background: "#f5f5f5" }}>
                        <Image src={imageUrl} alt={item.product.name} fill style={{ objectFit: "cover" }} sizes="80px" />
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Link href={`/products/${item.product.slug}`} onClick={() => setIsOpen(false)} style={{ fontWeight: 600, color: "var(--color-text-primary)", textDecoration: "none", fontSize: "15px", paddingRight: "24px" }}>
                            {item.product.name}
                          </Link>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", padding: "4px" }}
                            aria-label="Remove item"
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                        {item.variant && <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "4px" }}>SKU: {item.variant.sku}</div>}
                        
                        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                            <button onClick={() => handleQuantityChange(item.id, item.quantity - 1, stock)} disabled={item.quantity <= 1 || updatingItemId === item.id} style={{ width: "28px", height: "28px", background: "var(--color-surface)", border: "none", cursor: "pointer", color: "var(--color-text-primary)" }}>&minus;</button>
                            <div style={{ width: "32px", textAlign: "center", fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>{item.quantity}</div>
                            <button onClick={() => handleQuantityChange(item.id, item.quantity + 1, stock)} disabled={item.quantity >= stock || updatingItemId === item.id} style={{ width: "28px", height: "28px", background: "var(--color-surface)", border: "none", cursor: "pointer", color: "var(--color-text-primary)" }}>&#43;</button>
                          </div>
                          <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                            {formatRupees(itemPrice * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Summary */}
          {!loading && getCartItems().length > 0 && (
            <div style={{ padding: "24px", borderTop: "1px solid var(--color-border)", background: "var(--color-surface)", marginTop: "auto" }}>
              <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "var(--color-text-secondary)" }}>
                  <span>Subtotal</span>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{formatRupees(getSubtotal())}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "14px", color: "var(--color-text-secondary)" }}>
                  <span>Shipping</span>
                  <span style={{ color: "var(--color-success)", fontWeight: 500 }}>Free</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", fontSize: "18px", fontWeight: 700 }}>
                  <span style={{ color: "var(--color-text-primary)" }}>Total</span>
                  <span style={{ color: "var(--color-accent)" }}>{formatRupees(getSubtotal())}</span>
                </div>
                
                <TrackedLink
                  eventName="begin_checkout"
                  eventParams={{
                    currency: "INR",
                    value: getSubtotal() / 100,
                    items: cart?.items?.map(i => mapProductToGa4Item(i)) || []
                  }}
                  href="/checkout"
                  style={{ display: "block", textDecoration: "none" }}
                  onClick={() => setIsOpen(false)}
                >
                  <Button variant="primary" style={{ width: "100%", padding: "14px" }}>
                    Proceed to Checkout 🔒
                  </Button>
                </TrackedLink>
              </div>
            </div>
          )}
        </div>
      )}
    </>,
    document.body
  );
}
