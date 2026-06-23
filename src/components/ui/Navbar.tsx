import React, { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/ui/SearchBar";
import { NavbarAuthLinks } from "@/components/ui/NavbarAuthLinks";

/**
 * Shared public navigation bar with brand, search, and auth-aware links.
 * This is a Server Component — NavbarAuthLinks handles the async auth check.
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
          <Suspense fallback={<div className="search-bar-fallback" />}>
            <SearchBar />
          </Suspense>
        </div>

        {/* Auth-aware navigation links */}
        <Suspense
          fallback={
            <div className="site-navbar-links">
              <Link href="/products" className="site-navbar-link">Shop</Link>
            </div>
          }
        >
          <NavbarAuthLinks />
        </Suspense>
      </div>
    </nav>
  );
}
