"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NavbarIconsAndSearchProps {
  isLoggedIn: boolean;
  cartCount: number;
  wishlistIcon: React.ReactNode;
}

export function NavbarIconsAndSearch({ isLoggedIn, cartCount, wishlistIcon }: NavbarIconsAndSearchProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when it's opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/products?search=${encodeURIComponent(trimmed)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="navbar-right-container" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      {/* Search Input Overlay / Slide */}
      {showSearch && (
        <form onSubmit={handleSearchSubmit} className="navbar-search-inline-form" style={{ display: "flex", alignItems: "center", position: "relative" }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="navbar-search-inline-input"
            onBlur={() => {
              // Hide search bar after a short delay to allow clicks/submits
              setTimeout(() => {
                if (searchQuery === "") {
                  setShowSearch(false);
                }
              }, 200);
            }}
            style={{
              padding: "6px 12px",
              borderRadius: "50px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
              fontSize: "14px",
              width: "160px",
              outline: "none",
            }}
          />
        </form>
      )}

      {/* Search Icon Trigger */}
      <button
        onClick={() => setShowSearch(!showSearch)}
        className="navbar-icon-btn"
        aria-label="Search"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", padding: "4px" }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {/* Wishlist Link (Heart Icon) */}
      {wishlistIcon}


      {/* Profile/Account Link (User Icon) */}
      <Link
        href={isLoggedIn ? "/account" : "/login"}
        className="navbar-icon-btn"
        aria-label="Account"
        style={{ color: "var(--color-primary)", padding: "4px", display: "inline-flex", alignItems: "center" }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>

      {/* Cart Link (Shopping Bag Icon) */}
      <Link
        href="/cart"
        className="navbar-icon-btn relative"
        aria-label="Shopping Cart"
        style={{ color: "var(--color-primary)", padding: "4px", display: "inline-flex", alignItems: "center", position: "relative" }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        {cartCount > 0 && (
          <span
            className="cart-badge"
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              backgroundColor: "var(--color-primary)",
              color: "#fff",
              borderRadius: "50%",
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 700,
            }}
          >
            {cartCount}
          </span>
        )}
      </Link>
    </div>
  );
}
