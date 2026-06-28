"use client";

/**
 * MobileMenu — PDF p.18:
 * Mobile navbar: hamburger left, GVSWIFT centre (italic Garamond wine red), cart icon right.
 * Drawer: slides in from left, logo + close button top, nav links stacked, sign-out red at bottom.
 * PDF p.18 bottom nav bar: SHOP · SEARCH · ORDERS · PROFILE pill icons.
 */
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";


interface MobileMenuProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  cartCount: number;
}

export function MobileMenu({ isLoggedIn, isAdmin, cartCount }: MobileMenuProps) {
  const [clientCartCount, setClientCartCount] = useState(cartCount);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Sync state when props change
    setClientCartCount(cartCount);
  }, [cartCount]);

  useEffect(() => {
    const handleAddOne = () => setClientCartCount((c) => c + 1);
    const handleRemoveOne = () => setClientCartCount((c) => Math.max(0, c - 1));
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "number") {
        setClientCartCount(detail);
      }
    };

    window.addEventListener("gvswift-cart-add-one", handleAddOne);
    window.addEventListener("gvswift-cart-remove-one", handleRemoveOne);
    window.addEventListener("gvswift-cart-updated", handleUpdate);

    return () => {
      window.removeEventListener("gvswift-cart-add-one", handleAddOne);
      window.removeEventListener("gvswift-cart-remove-one", handleRemoveOne);
      window.removeEventListener("gvswift-cart-updated", handleUpdate);
    };
  }, []);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; slug: string }[]>([]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products ?? []);
        }
      } catch (err) {
        console.error("Autocomplete fetch failed:", err);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/products?search=${encodeURIComponent(trimmed)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsSearchOpen(false);
      }
    };
    if (isOpen || isSearchOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, isSearchOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) { if (document.activeElement === first) { last.focus(); e.preventDefault(); } }
      else { if (document.activeElement === last) { first.focus(); e.preventDefault(); } }
    };
    window.addEventListener("keydown", trap);
    first?.focus();
    return () => window.removeEventListener("keydown", trap);
  }, [isOpen]);

  const close = () => setIsOpen(false);

  const handleLogout = async () => {
    close();
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  /* Bottom nav tabs — PDF p.18 */
  const bottomTabs: { label: string; href: string; icon: string }[] = [
    { label: "Shop",    href: "/products",        icon: "🛍" },
    { label: "Orders",  href: "/account/orders",  icon: "📋" },
    { label: "Profile", href: isLoggedIn ? "/account/profile" : "/login", icon: "👤" },
  ];

  return (
    <>
      {/* ── Hamburger trigger ──────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mobile-hamburger-btn"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        style={{ color: "var(--color-accent)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {isOpen ? (
            <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
          ) : (
            <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>
          )}
        </svg>
      </button>

      {mounted && typeof document !== "undefined" ? createPortal(
        <>
          {/* ── Overlay ────────────────────────────────────────────────────── */}
          {isOpen && (
            <div
              className="mobile-drawer-overlay"
              onClick={close}
              aria-hidden
            />
          )}

          {/* ── Drawer ─────────────────────────────────────────────────────── */}
          <div
            id="mobile-drawer"
            ref={drawerRef}
            className={`mobile-drawer ${isOpen ? "mobile-drawer-open" : ""}`}
            aria-hidden={!isOpen}
          >
            <div className="mobile-drawer-inner">
              {/* Header — close button only; logo lives in the main navbar */}
              <div className="mobile-drawer-header" style={{ justifyContent: "flex-end" }}>
                <button onClick={close} className="mobile-drawer-close" aria-label="Close menu">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Nav links */}
              <nav className="mobile-drawer-nav">
                {[
                  { label: "New Arrivals", href: "/products?sort=newest" },
                  { label: "Collections",  href: "/products" },
                  { label: "FAQ",          href: "/faq" },
                  { label: "Support",      href: "/support" },
                ].map(({ label, href }) => (
                  <Link key={label} href={href} onClick={close} className="mobile-drawer-link">
                    {label}
                  </Link>
                ))}

                <div className="mobile-drawer-divider" />

                {isLoggedIn ? (
                  <>
                    <Link href="/account/profile" onClick={close} className="mobile-drawer-link">My Account</Link>
                    <Link href="/account/orders"  onClick={close} className="mobile-drawer-link">My Orders</Link>
                    <Link href="/account/wishlist" onClick={close} className="mobile-drawer-link">Wishlist</Link>
                    <Link href="/cart" onClick={close} className="mobile-drawer-link" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Cart</span>
                      {clientCartCount > 0 && (
                        <span className="mobile-drawer-badge">{clientCartCount}</span>
                      )}
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={close} className="mobile-drawer-link" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
                        Admin Console
                      </Link>
                    )}
                    <button onClick={handleLogout} className="mobile-drawer-logout-btn">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login"  onClick={close} className="mobile-drawer-link">Sign In</Link>
                    <Link href="/signup" onClick={close} className="mobile-drawer-signup-btn">Create Account</Link>
                  </>
                )}
              </nav>
            </div>
          </div>

          {/* ── Bottom nav bar — PDF p.18 ──────────────────────────────────── */}
          <nav
            aria-label="Bottom navigation"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: "64px",
              background: "rgba(253,250,245,0.96)",
              backdropFilter: "blur(12px)",
              borderTop: "1px solid var(--color-border)",
              display: "none", /* shown via media query below */
              alignItems: "center",
              justifyContent: "space-around",
              zIndex: 9999,
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            className="mobile-bottom-nav"
          >
            {/* Shop tab */}
            {bottomTabs.map(({ label, href, icon }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href.split("?")[0]));
              return (
                <Link
                  key={label}
                  href={href}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    textDecoration: "none",
                    flex: 1,
                    padding: "8px 0",
                  }}
                >
                  <span
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: isActive ? "rgba(107,30,46,0.1)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      transition: "background 0.2s",
                    }}
                  >
                    {icon}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                    }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}

            {/* Search tab — opens overlay instead of navigating */}
            <button
              onClick={() => setIsSearchOpen(true)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                flex: 1,
                padding: "8px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: isSearchOpen ? "rgba(107,30,46,0.1)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  transition: "background 0.2s",
                }}
              >
                🔍
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isSearchOpen ? 600 : 400,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: isSearchOpen ? "var(--color-accent)" : "var(--color-text-secondary)",
                }}
              >
                Search
              </span>
            </button>
          </nav>

          {/* ── Full-screen search overlay ──────────────────────────────────── */}
          {isSearchOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 10000,
                background: "rgba(253,250,245,0.98)",
                backdropFilter: "blur(8px)",
                display: "flex",
                flexDirection: "column",
                padding: "20px",
              }}
            >
              {/* Close button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                <button
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setSearchResults([]); }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "28px",
                    color: "var(--color-text-primary)",
                    cursor: "pointer",
                    padding: "4px",
                    lineHeight: 1,
                  }}
                  aria-label="Close search"
                >
                  ×
                </button>
              </div>

              {/* Search form */}
              <form onSubmit={handleSearchSubmit} style={{ marginBottom: "16px" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    borderRadius: "12px",
                    border: "1px solid var(--color-border)",
                    fontSize: "16px",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </form>

              {/* Search results */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {searchResults.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                    {searchResults.map((product) => (
                      <li key={product.id}>
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setSearchResults([]); }}
                          style={{
                            display: "block",
                            padding: "14px 16px",
                            borderRadius: "10px",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-bg)",
                            textDecoration: "none",
                            color: "var(--color-text-primary)",
                            fontSize: "15px",
                            fontWeight: 500,
                            transition: "background 0.15s",
                          }}
                        >
                          {product.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : searchQuery.length >= 2 ? (
                  <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "40px" }}>
                    No products found for &ldquo;{searchQuery}&rdquo;
                  </p>
                ) : (
                  <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "40px" }}>
                    Start typing to search products
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Bottom nav spacer so page content isn't hidden behind it */}
          <div className="mobile-bottom-spacer" style={{ display: "none", height: "64px" }} />

          <style>{`
            @media (max-width: 767px) {
              .mobile-bottom-nav    { display: flex !important; }
              .mobile-bottom-spacer { display: block !important; }
            }
          `}</style>
        </>
        , document.body
      ) : null}
    </>
  );
}