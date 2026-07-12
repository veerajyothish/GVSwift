"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const isPending = false; // We removed useTransition to keep it simple, or we can just remove isPending

  // Optimistic UI state
  const [optCategoryId, setOptCategoryId] = useState(currentCategoryId);
  const [optSort, setOptSort] = useState(currentSort);
  const [optMaxPrice, setOptMaxPrice] = useState(currentMaxPrice);

  // Sync with actual URL when it changes
  useEffect(() => {
    setOptCategoryId(currentCategoryId);
    setOptSort(currentSort);
    setOptMaxPrice(currentMaxPrice);
  }, [currentCategoryId, currentSort, currentMaxPrice, searchParams]);

  const buildUrl = (updates: {
    categoryId?: string | null;
    page?: number | null;
    sort?: string | null;
    maxPrice?: string | null;
  }) => {
    const p = new URLSearchParams();
    const catId = updates.categoryId !== undefined ? updates.categoryId : currentCategoryId;
    if (catId) p.set("categoryId", catId);
    
    // Reset page to 1 when filters change unless page is explicitly passed
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

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "40px",
          opacity: isPending ? 0.7 : 1,
          transition: "opacity 0.2s ease",
        }}
        className="animate-in delay-50"
      >
        <nav
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            flexWrap: "nowrap",
            flexGrow: 1,
            paddingBottom: "8px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
          className="hide-scrollbar"
        >
          <Link
            href={buildUrl({ categoryId: null, page: 1 })}
            onClick={() => {
              setOptCategoryId("");
              // Optional: Add useTransition for smoother React 18 rendering
            }}
            className={!optCategoryId ? "category-link-active" : "category-link"}
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildUrl({ categoryId: cat.id, page: 1 })}
              onClick={() => {
                setOptCategoryId(cat.id);
              }}
              className={optCategoryId === cat.id ? "category-link-active" : "category-link"}
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
            Sort by:
          </span>
          <nav
            style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              flexWrap: "nowrap",
              flexGrow: 1,
              paddingBottom: "8px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
            className="hide-scrollbar"
          >
            {[
              { label: "Featured", value: "newest" },
              { label: "Price ↑", value: "price-asc" },
              { label: "Price ↓", value: "price-desc" },
            ].map((opt) => (
              <Link
                key={opt.value}
                href={buildUrl({ sort: opt.value, page: 1 })}
                onClick={() => setOptSort(opt.value)}
                style={{
                  fontSize: "13px",
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  border: `1px solid ${optSort === opt.value ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: optSort === opt.value ? "rgba(107,30,46,0.06)" : "transparent",
                  color: optSort === opt.value ? "var(--color-accent)" : "var(--color-text-secondary)",
                  fontWeight: optSort === opt.value ? 600 : 400,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {opt.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "nowrap",
          overflowX: "auto",
          marginBottom: "36px",
          paddingBottom: "4px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          opacity: isPending ? 0.7 : 1,
          transition: "opacity 0.2s ease",
        }}
        className="hide-scrollbar"
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-text-secondary)",
          }}
        >
          Price:
        </span>
        {[
          { label: "All", value: "" },
          { label: "Under ₹500", value: "500" },
          { label: "Under ₹1,000", value: "1000" },
          { label: "Under ₹2,000", value: "2000" },
        ].map((opt) => (
          <Link
            key={opt.value}
            href={buildUrl({ maxPrice: opt.value || null, page: 1 })}
            onClick={() => setOptMaxPrice(opt.value)}
            style={{
              fontSize: "12px",
              padding: "5px 14px",
              borderRadius: "9999px",
              border: `1px solid ${optMaxPrice === opt.value ? "var(--color-accent)" : "var(--color-border)"}`,
              background: optMaxPrice === opt.value ? "rgba(107,30,46,0.06)" : "transparent",
              color: optMaxPrice === opt.value ? "var(--color-accent)" : "var(--color-text-secondary)",
              fontWeight: optMaxPrice === opt.value ? 600 : 400,
              textDecoration: "none",
            }}
          >
            {opt.label}
          </Link>
        ))}
      </div>
    </>
  );
}
