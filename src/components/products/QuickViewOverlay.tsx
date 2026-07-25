"use client";

import React, { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { trackEvent } from "@/lib/analytics/ga4";
import { mapProductToGa4Item } from "@/lib/analytics/ecommerce";
import type { ProductWithVariantsAndImages } from "@/features/catalog/types";

export function QuickViewOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductWithVariantsAndImages | null>(null);
  
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const handleOpen = async (e: Event) => {
      const customEvent = e as CustomEvent<{ slug: string }>;
      const { slug } = customEvent.detail;
      setIsOpen(true);
      setLoading(true);
      setProduct(null);

      try {
        const res = await fetch(`/api/v1/products/${slug}`);
        if (!res.ok) throw new Error("Failed to load product");
        const data: ProductWithVariantsAndImages = await res.json();
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariantId(data.variants[0].id);
        }
      } catch (err) {
        console.error(err);
        toast.error("Could not load product details.");
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener("gvswift-open-quickview", handleOpen);
    return () => {
      window.removeEventListener("gvswift-open-quickview", handleOpen);
    };
  }, [toast]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const closeOverlay = () => {
    setIsOpen(false);
  };

  const handleAddToCart = async () => {
    if (!product || !selectedVariantId) return;
    
    const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
    if (!selectedVariant || selectedVariant.stock === 0) return;

    setIsAddingToCart(true);

    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: selectedVariant.id, quantity: 1 }),
      });
      
      if (res.status === 401) {
        toast.error("Please sign in to add items to your cart.");
        setIsAddingToCart(false);
        return;
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");
      
      const variantName = selectedVariant.sku || selectedVariant.id;
      trackEvent("add_to_cart", {
        currency: "INR",
        value: ((product.basePricePaise + selectedVariant.priceDeltaPaise) / 100),
        items: [
          mapProductToGa4Item(product, {
            item_variant: variantName,
            quantity: 1,
          }),
        ],
      });

      toast.success(`Added ${product.name} to cart!`);
      
      // Dispatch fly animation
      const primaryImg = product.images?.find((img) => img.isPrimary) || product.images?.[0];
      if (primaryImg?.url) {
        window.dispatchEvent(new CustomEvent("gvswift-cart-fly", { detail: primaryImg.url }));
      }
      
      // Close Quick View and open Cart
      setIsOpen(false);
      setTimeout(() => {
        window.dispatchEvent(new Event("gvswift-open-cart"));
      }, 300);

    } catch (err) {
      console.error(err);
      toast.error("Could not add to cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const parseVariantSku = (sku: string) => {
    if (!sku) return { size: "Default", color: "Default" };
    const parts = sku.split("-");
    return { size: parts[parts.length - 1] || sku, color: parts[parts.length - 2] || "Default" };
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease-out forwards",
        padding: "16px",
      }}
      onClick={closeOverlay}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}} />
      
      <div
        style={{
          background: "var(--color-bg)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "row", // Desktop side-by-side
          position: "relative",
          animation: "scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        }}
        className="quick-view-container"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 768px) {
            .quick-view-container {
              flex-direction: column !important;
              max-height: 85vh !important;
            }
            .quick-view-image {
              height: 300px !important;
              flex: none !important;
            }
            .quick-view-content {
              overflow-y: auto !important;
            }
          }
        `}} />

        <button
          onClick={closeOverlay}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(4px)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}
          aria-label="Close quick view"
        >
          <X size={18} color="#000" />
        </button>

        {loading ? (
          <div style={{ padding: "100px", width: "100%", textAlign: "center", color: "var(--color-text-secondary)" }}>
            Loading product details...
          </div>
        ) : !product ? (
          <div style={{ padding: "100px", width: "100%", textAlign: "center", color: "var(--color-text-secondary)" }}>
            Product not found.
          </div>
        ) : (
          <>
            {/* Image Section */}
            <div
              className="quick-view-image"
              style={{
                flex: 1,
                position: "relative",
                background: "var(--color-surface)",
              }}
            >
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                  alt={product.name}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  No Image
                </div>
              )}
            </div>

            {/* Content Section */}
            <div
              className="quick-view-content"
              style={{
                flex: 1,
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              <div>
                {product.brand && (
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                    {product.brand}
                  </div>
                )}
                <h2 style={{ fontSize: "24px", margin: "0 0 8px 0", fontFamily: "var(--font-heading)", color: "var(--color-primary)", lineHeight: 1.2 }}>
                  {product.name}
                </h2>
                <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                  ₹{((product.basePricePaise + (product.variants?.find(v => v.id === selectedVariantId)?.priceDeltaPaise || 0)) / 100).toLocaleString("en-IN")}
                </div>
              </div>

              {product.description && (
                <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {product.description}
                </p>
              )}

              {/* Sizes */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "12px", color: "var(--color-text-primary)" }}>
                    Size
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {product.variants.map((v) => {
                      const { size } = parseVariantSku(v.sku);
                      const isSelected = selectedVariantId === v.id;
                      const outOfStock = v.stock === 0;

                      return (
                        <button
                          key={v.id}
                          onClick={() => !outOfStock && setSelectedVariantId(v.id)}
                          disabled={outOfStock}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "999px",
                            border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                            background: isSelected ? "var(--color-accent)" : "transparent",
                            color: isSelected ? "#fff" : outOfStock ? "var(--color-text-tertiary)" : "var(--color-text-primary)",
                            fontSize: "13px",
                            fontWeight: isSelected ? 600 : 500,
                            cursor: outOfStock ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: outOfStock ? 0.5 : 1,
                            textDecoration: outOfStock ? "line-through" : "none",
                          }}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginTop: "auto", paddingTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !selectedVariantId || (product.variants?.find(v => v.id === selectedVariantId)?.stock === 0)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: "var(--color-accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: (isAddingToCart || !selectedVariantId) ? "not-allowed" : "pointer",
                    letterSpacing: "0.02em",
                    opacity: (isAddingToCart || !selectedVariantId) ? 0.7 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {isAddingToCart ? "Adding..." : (product.variants?.find(v => v.id === selectedVariantId)?.stock === 0 ? "Out of Stock" : "Add to Cart")}
                </button>
                
                <Link
                  href={`/products/${product.slug}`}
                  onClick={closeOverlay}
                  style={{
                    textAlign: "center",
                    fontSize: "14px",
                    color: "var(--color-text-secondary)",
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                  }}
                >
                  View Full Details
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
