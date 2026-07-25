"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

import { X } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import type { ProductWithVariantsAndImages } from "@/features/catalog/types";
import { useOverlay } from "@/hooks/useOverlay";

export function WishlistOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductWithVariantsAndImages[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeOverlay = useCallback(() => setIsOpen(false), []);
  useOverlay(isOpen, closeOverlay, panelRef);

  useEffect(() => {
    setMounted(true);

    const handleOpen = async () => {
      setIsOpen(true);
      setLoading(true);

      try {
        const res = await fetch("/api/v1/wishlist/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener("gvswift-open-wishlist", handleOpen);
    return () => window.removeEventListener("gvswift-open-wishlist", handleOpen);
  }, []);



  if (!mounted || !isOpen) return null;

  if (!mounted) return null;

  return createPortal(
    <div
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="wishlist-heading"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}} />
      <div
        ref={panelRef}
        style={{
          width: "100%",
          maxWidth: "480px", // A bit wider to accommodate product grid nicely, or single col
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
          <h2 id="wishlist-heading" style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "20px", color: "var(--color-primary)" }}>
            Your Wishlist
          </h2>
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
            aria-label="Close wishlist"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "var(--color-surface)" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--color-text-secondary)", marginTop: "40px" }}>
              Loading wishlist...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", marginTop: "40px" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontStyle: "italic", margin: 0 }}>
                Your wishlist is empty
              </p>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>
                Save items you love by tapping the heart icon.
              </p>
              <button
                onClick={() => {
                  closeOverlay();
                  window.location.href = "/products";
                }}
                className="btn btn-primary btn-premium"
                style={{ marginTop: "16px" }}
              >
                Browse Collection
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "16px",
              }}
            >
              {products.map((p) => (
                <div key={p.id} onClick={closeOverlay}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <ProductCard product={p as any} initialWishlisted={true} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
