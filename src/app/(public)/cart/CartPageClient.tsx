"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
      <div className="card cart-empty-card">
        <span className="cart-empty-icon">🛒</span>
        <h2 className="text-2xl font-semibold">Your cart is empty</h2>
        <p className="text-sm footer-text-muted">
          Browse our premium catalog of high-quality fashion products and add items to your cart.
        </p>
        <Link href="/products" style={{ marginTop: "8px" }}>
          <Button variant="primary" style={{ padding: "10px 32px" }}>Shop Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-grid">
      {/* Items list */}
      <div className="cart-items-column">
        {items.map((item) => {
          const itemPrice = getItemPrice(item);
          const stock = item.variant?.stock ?? 0;
          // Find primary image or fallback
          const imageObj = item.product.images?.find((img) => img.isPrimary) || item.product.images?.[0];
          const imageUrl = imageObj?.url || "/fashion_product_mockup.png";

          return (
            <div
              key={item.id}
              className="card cart-item-card"
              style={{ opacity: updatingItemId === item.id ? 0.7 : 1 }}
            >
              {/* Product Thumbnail */}
              <div className="cart-item-thumb-container">
                <Image
                  src={imageUrl}
                  alt={imageObj?.altText || item.product.name}
                  className="cart-item-thumb-img"
                  fill
                  sizes="80px"
                />
              </div>

              {/* Item Details */}
              <div className="cart-item-details-container">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="cart-item-title-link"
                >
                  {item.product.name}
                </Link>

                {item.variant && (
                  <span className="cart-item-sku">
                    SKU: {item.variant.sku}
                  </span>
                )}

                <div className="cart-item-actions-row">
                  {/* Quantity Stepper */}
                  <div className="cart-quantity-stepper">
                    <button
                      type="button"
                      disabled={item.quantity <= 1 || updatingItemId === item.id}
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1, stock)}
                      className="stepper-btn"
                    >
                      &minus;
                    </button>
                    <span className="cart-stepper-value">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= stock || updatingItemId === item.id}
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1, stock)}
                      className="stepper-btn"
                    >
                      &#43;
                    </button>
                  </div>

                  {/* Price */}
                  <div className="cart-price-container">
                    <div className="cart-price-total">
                      {formatRupees(itemPrice * item.quantity)}
                    </div>
                    {item.quantity > 1 && (
                      <div className="cart-price-each">
                        {formatRupees(itemPrice)} each
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <div className="flex" style={{ alignItems: "start" }}>
                <button
                  type="button"
                  aria-label="Remove item"
                  disabled={updatingItemId === item.id}
                  onClick={() => handleRemoveItem(item.id)}
                  className="cart-remove-btn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="icon-xs"
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
        <div className="card p-5 cart-summary-sticky">
          <h2 className="text-lg font-semibold cart-summary-title">
            Order Summary
          </h2>

          <div className="cart-summary-rows">
            <div className="cart-summary-row">
              <span className="footer-text-muted">Subtotal</span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatRupees(subtotal)}</span>
            </div>
            <div className="cart-summary-row">
              <span className="footer-text-muted">Shipping</span>
              <span style={{ color: "var(--color-success)", fontWeight: 500 }}>FREE</span>
            </div>
            <div className="cart-summary-row">
              <span className="footer-text-muted">COD Fee</span>
              <span style={{ color: "var(--color-success)", fontWeight: 500 }}>FREE</span>
            </div>
          </div>

          <div style={{ borderBottom: "1px solid var(--color-border)" }} />

          <div className="cart-summary-total-row">
            <span style={{ fontSize: "16px", fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-accent)", fontVariantNumeric: "tabular-nums" }}>{formatRupees(subtotal)}</span>
          </div>

          <Link href="/checkout" style={{ display: "block", marginTop: "8px" }}>
            <Button variant="primary" style={{ width: "100%" }}>
              Proceed to Checkout &rarr;
            </Button>
          </Link>

          <span className="text-xs footer-text-muted" style={{ textAlign: "center", display: "block" }}>
            Free delivery & Cash on Delivery (COD) applied.
          </span>
        </div>
      </div>
    </div>
  );
}
