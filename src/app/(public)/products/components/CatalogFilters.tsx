"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useOverlay } from "@/hooks/useOverlay";

interface CatalogFiltersProps {
  categories: { id: string; name: string }[];
  currentCategoryId: string;
  currentSort: string;
  currentMaxPrice: string;
  currentSearch: string;
}

export function CatalogFilters({
  categories,
  currentCategoryId,
  currentSort,
  currentMaxPrice,
  currentSearch,
}: CatalogFiltersProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeOverlay = useCallback(() => setIsOpen(false), []);
  useOverlay(isOpen, closeOverlay, panelRef);

  useEffect(() => {
    setMounted(true);
  }, []);



  const buildUrl = (updates: {
    categoryId?: string | null;
    page?: number | null;
    sort?: string | null;
    maxPrice?: string | null;
  }) => {
    const p = new URLSearchParams();
    const catId = updates.categoryId !== undefined ? updates.categoryId : currentCategoryId;
    if (catId) p.set("categoryId", catId);
    
    const pg = updates.page !== undefined ? updates.page : 1; 
    if (pg && pg > 1) p.set("page", pg.toString());
    
    if (currentSearch) p.set("search", currentSearch);
    const s = updates.sort !== undefined ? updates.sort : currentSort;
    if (s && s !== "newest") p.set("sort", s);
    const mp = updates.maxPrice !== undefined ? updates.maxPrice : currentMaxPrice;
    if (mp) p.set("maxPrice", mp);
    
    const qs = p.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  };


  const filterOverlay = mounted && isOpen ? createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "fadeIn 0.2s ease-out forwards",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-heading"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          background: "rgba(255,255,255,0.8)",
        }}
      >
        <h2 id="filters-heading" style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, fontFamily: "var(--font-heading)", letterSpacing: "0.02em", color: "var(--color-primary)" }}>
          Filters & Sort
        </h2>
        <button
          onClick={closeOverlay}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            margin: "-8px",
            color: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Close filters"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          animation: "slideUp 0.3s ease-out forwards",
        }}
      >
        {/* Categories */}
        <section>
          <h3 style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: "16px" }}>Category</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link
              href={buildUrl({ categoryId: null, page: 1 })}
              onClick={closeOverlay}
              style={{
                textDecoration: "none",
                fontSize: "15px",
                color: !currentCategoryId ? "var(--color-accent)" : "var(--color-primary)",
                fontWeight: !currentCategoryId ? 600 : 400,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              All Products
              {!currentCategoryId && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              )}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={buildUrl({ categoryId: cat.id, page: 1 })}
                onClick={closeOverlay}
                style={{
                  textDecoration: "none",
                  fontSize: "15px",
                  color: currentCategoryId === cat.id ? "var(--color-accent)" : "var(--color-primary)",
                  fontWeight: currentCategoryId === cat.id ? 600 : 400,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                {cat.name}
                {currentCategoryId === cat.id && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                )}
              </Link>
            ))}
          </div>
        </section>

        <hr style={{ border: 0, height: "1px", background: "rgba(0,0,0,0.05)", margin: 0 }} />

        {/* Sort */}
        <section>
          <h3 style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: "16px" }}>Sort By</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {[
              { label: "Featured", value: "newest" },
              { label: "Price: Low to High", value: "price-asc" },
              { label: "Price: High to Low", value: "price-desc" },
            ].map((opt) => (
              <Link
                key={opt.value}
                href={buildUrl({ sort: opt.value, page: 1 })}
                onClick={closeOverlay}
                style={{
                  fontSize: "14px",
                  padding: "8px 16px",
                  borderRadius: "9999px",
                  border: `1px solid ${currentSort === opt.value ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: currentSort === opt.value ? "rgba(107,30,46,0.06)" : "transparent",
                  color: currentSort === opt.value ? "var(--color-accent)" : "var(--color-text-secondary)",
                  fontWeight: currentSort === opt.value ? 600 : 400,
                  textDecoration: "none",
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </section>

        <hr style={{ border: 0, height: "1px", background: "rgba(0,0,0,0.05)", margin: 0 }} />

        {/* Price */}
        <section>
          <h3 style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: "16px" }}>Max Price</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {[
              { label: "Any Price", value: "" },
              { label: "Under ₹500", value: "500" },
              { label: "Under ₹1,000", value: "1000" },
              { label: "Under ₹2,000", value: "2000" },
            ].map((opt) => (
              <Link
                key={opt.value}
                href={buildUrl({ maxPrice: opt.value || null, page: 1 })}
                onClick={closeOverlay}
                style={{
                  fontSize: "14px",
                  padding: "8px 16px",
                  borderRadius: "9999px",
                  border: `1px solid ${currentMaxPrice === opt.value ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: currentMaxPrice === opt.value ? "rgba(107,30,46,0.06)" : "transparent",
                  color: currentMaxPrice === opt.value ? "var(--color-accent)" : "var(--color-text-secondary)",
                  fontWeight: currentMaxPrice === opt.value ? 600 : 400,
                  textDecoration: "none",
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Footer sticky action */}
      <div
        style={{
          padding: "20px 24px",
          borderTop: "1px solid rgba(0,0,0,0.05)",
          background: "rgba(255,255,255,0.9)",
        }}
      >
        <button
          onClick={closeOverlay}
          style={{
            width: "100%",
            padding: "16px",
            background: "var(--color-accent)",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          View Results
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "1px solid var(--color-border)",
            padding: "10px 20px",
            borderRadius: "9999px",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-primary)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-accent)";
            e.currentTarget.style.color = "var(--color-accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.color = "var(--color-primary)";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          Filters & Sort
          {/* Show badge if filters are active */}
          {(currentCategoryId || currentSort !== "newest" || currentMaxPrice) && (
            <span style={{ 
              display: "inline-block", 
              width: "8px", 
              height: "8px", 
              borderRadius: "50%", 
              background: "var(--color-accent)",
              marginLeft: "4px"
            }} />
          )}
        </button>
      </div>

      {filterOverlay}
    </>
  );
}
