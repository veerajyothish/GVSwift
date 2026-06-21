"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * SearchBar — a client component for the public navbar.
 *
 * Submitting navigates to /products?search=<query>, preserving
 * any existing categoryId. Clearing the input removes the search param.
 *
 * Styled with the Black & Gold Stitch design system CSS variables.
 */
export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when URL changes externally (e.g. "Clear search" link)
  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim().replace(/\s+/g, " ").slice(0, 100);

      const params = new URLSearchParams();

      // Preserve category filter
      const cat = searchParams.get("categoryId");
      if (cat) params.set("categoryId", cat);

      if (trimmed) {
        params.set("search", trimmed);
      }

      // Always reset to page 1 on a new search
      const qs = params.toString();
      router.push(`/products${qs ? `?${qs}` : ""}`);
    },
    [query, searchParams, router]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    const params = new URLSearchParams();
    const cat = searchParams.get("categoryId");
    if (cat) params.set("categoryId", cat);
    const qs = params.toString();
    router.push(`/products${qs ? `?${qs}` : ""}`);
    inputRef.current?.focus();
  }, [searchParams, router]);

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search products"
      className="search-bar"
    >
      <div className={`search-bar-inner ${isFocused ? "search-bar-focused" : ""}`}>
        {/* Search icon */}
        <svg
          className="search-bar-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={inputRef}
          type="search"
          id="product-search"
          name="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search products…"
          maxLength={100}
          autoComplete="off"
          className="search-bar-input"
          aria-label="Search products"
        />

        {/* Clear button — visible only when there is text */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="search-bar-clear"
            aria-label="Clear search"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
