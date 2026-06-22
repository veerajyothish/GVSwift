import React, { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/ui/SearchBar";

/**
 * Shared public navigation bar with brand, search, and links.
 * Rendered at the top of every public page via a layout or
 * included directly in pages.
 */
export function Navbar() {
  return (
    <nav className="site-navbar" aria-label="Main navigation">
      <div className="site-navbar-inner">
        {/* Brand */}
        <Link href="/" className="site-navbar-brand">
          <span className="site-navbar-logo">GV</span>
          <span className="site-navbar-name">Swift</span>
        </Link>

        {/* Search bar (client component) */}
        <div className="site-navbar-search">
          <Suspense fallback={<div style={{ width: "100%", height: "40px" }} />}>
            <SearchBar />
          </Suspense>
        </div>

        {/* Navigation links */}
        <div className="site-navbar-links">
          <Link href="/products" className="site-navbar-link">
            Shop
          </Link>
          <Link href="/cart" className="site-navbar-link">
            Cart
          </Link>
          <Link href="/orders" className="site-navbar-link">
            Orders
          </Link>
          <Link href="/account/addresses" className="site-navbar-link">
            Addresses
          </Link>
        </div>
      </div>
    </nav>
  );
}
