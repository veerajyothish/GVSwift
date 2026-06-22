"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

// Detailed interface matching our Prisma schema query output
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

interface CartPageClientProps {
  initialCart: Cart | null;
}

export default function CartPageClient({ initialCart }: CartPageClientProps) {
  const { toast } = useToast();
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const formatRupees = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(paise / 100);
  };

  const getCartItems = () => cart?.items || [];

  // Calculate prices
  const getItemPrice = (item: CartItem) => {
    const base = item.product.basePricePaise;
    const delta = item.variant?.priceDeltaPaise ?? 0;
    return base + delta;
  };

  const getSubtotal = () => {
    return getCartItems().reduce((total, item) => {
      return total + getItemPrice(item) * item.quantity;
    }, 0);
  };

  const handleQuantityChange = async (itemId: string, newQty: number, stock: number) => {
    if (newQty < 1) return;
    if (newQty > stock) {
      toast.error(`Cannot set quantity to ${newQty}. Only ${stock} items available in stock.`, "Out of Stock");
      return;
    }

    setUpdatingItemId(itemId);

    try {
      const res = await fetch(`/api/v1/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update quantity");
      }

      // Update state locally
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
      toast.error(error.message || "Could not update item quantity", "Error");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this item from your cart?")) return;

    setUpdatingItemId(itemId);

    try {
      const res = await fetch(`/api/v1/cart/${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove item");
      }

      toast.success("Item removed from cart");

      // Update state locally
      setCart((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter((item) => item.id !== itemId),
        };
      });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not remove item", "Error");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const items = getCartItems();
  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "48px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <span style={{ fontSize: "48px" }}>🛒</span>
        <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>Your cart is empty</h2>
        <p style={{ color: "var(--color-text-secondary)", maxWidth: "400px", fontSize: "14px" }}>
          Browse our premium catalog of high-quality fashion products and add items to your cart.
        </p>
        <Link href="/products" style={{ marginTop: "8px" }}>
          <Button variant="primary" style={{ padding: "10px 32px" }}>Shop Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px", width: "100%" }} className="md:grid-cols-3">
      {/* Items list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="md:col-span-2">
        {items.map((item) => {
          const itemPrice = getItemPrice(item);
          const stock = item.variant?.stock ?? 0;
          // Find primary image or fallback
          const imageObj = item.product.images?.find((img) => img.isPrimary) || item.product.images?.[0];
          const imageUrl = imageObj?.url || "/fashion_product_mockup.png";

          return (
            <div
              key={item.id}
              className="card"
              style={{
                padding: "16px",
                display: "flex",
                gap: "16px",
                backgroundColor: "var(--color-surface)",
                opacity: updatingItemId === item.id ? 0.7 : 1,
                transition: "opacity 0.2s ease",
              }}
            >
              {/* Product Thumbnail */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  position: "relative",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  flexShrink: 0,
                  backgroundColor: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <img
                  src={imageUrl}
                  alt={imageObj?.altText || item.product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              {/* Item Details */}
              <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
                <Link
                  href={`/products/${item.product.slug}`}
                  className="font-medium"
                  style={{
                    color: "var(--color-text-primary)",
                    fontSize: "15px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
                >
                  {item.product.name}
                </Link>

                {item.variant && (
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                    SKU: {item.variant.sku}
                  </span>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginTop: "auto" }}>
                  {/* Quantity Stepper */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      height: "32px",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      disabled={item.quantity <= 1 || updatingItemId === item.id}
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1, stock)}
                      style={{
                        width: "32px",
                        height: "100%",
                        border: "none",
                        backgroundColor: "transparent",
                        color: "var(--color-text-primary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                      }}
                      onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"; }}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      &minus;
                    </button>
                    <span
                      style={{
                        padding: "0 12px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        userSelect: "none",
                      }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= stock || updatingItemId === item.id}
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1, stock)}
                      style={{
                        width: "32px",
                        height: "100%",
                        border: "none",
                        backgroundColor: "transparent",
                        color: "var(--color-text-primary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                      }}
                      onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"; }}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      &#43;
                    </button>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {formatRupees(itemPrice * item.quantity)}
                    </div>
                    {item.quantity > 1 && (
                      <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        {formatRupees(itemPrice)} each
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <div style={{ display: "flex", alignItems: "start" }}>
                <button
                  type="button"
                  aria-label="Remove item"
                  disabled={updatingItemId === item.id}
                  onClick={() => handleRemoveItem(item.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    transition: "color 0.2s ease, background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-error)"; e.currentTarget.style.backgroundColor = "rgba(255, 92, 92, 0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    style={{ width: "16px", height: "16px" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Sidebar */}
      <div>
        <div className="card p-5" style={{ display: "flex", flexDirection: "column", gap: "20px", backgroundColor: "var(--color-surface)", position: "sticky", top: "84px" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px", margin: 0 }}>
            Order Summary
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Subtotal</span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{formatRupees(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Shipping</span>
              <span style={{ color: "var(--color-success)", fontWeight: 500 }}>FREE</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>COD Fee</span>
              <span style={{ color: "var(--color-success)", fontWeight: 500 }}>FREE</span>
            </div>
          </div>

          <div style={{ borderBottom: "1px solid var(--color-border)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "16px", fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-accent)" }}>{formatRupees(subtotal)}</span>
          </div>

          <Link href="/checkout" style={{ display: "block", marginTop: "8px" }}>
            <Button variant="primary" style={{ width: "100%" }}>
              Proceed to Checkout &rarr;
            </Button>
          </Link>

          <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", textAlign: "center", display: "block" }}>
            Free delivery & Cash on Delivery (COD) applied.
          </span>
        </div>
      </div>
    </div>
  );
}
