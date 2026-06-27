/**
 * Navbar — PDF p.1/4/6/8/11:
 * Logo "GVSwift" italic Garamond left, nav links center (COLLECTION HERITAGE STORES JOURNAL),
 * icons right (search, account circle dashed, cart bag).
 * Mobile p.18: hamburger left, GVSWIFT centre, cart right.
 */
import React from "react";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { MobileMenu } from "./MobileMenu";
import { NavbarIconsAndSearch } from "./NavbarIconsAndSearch";
import { getPrismaUserBySupabaseId } from "@/lib/auth/guards";
import SearchBar from "./SearchBar";
import Image from "next/image";

export async function Navbar() {
  const session = await getServerSession();

  let isLoggedIn = false;
  let isAdmin = false;
  let cartCount = 0;
  let wishlistCount = 0;

  if (session) {
    isLoggedIn = true;
    try {
      const user = await getPrismaUserBySupabaseId(session.id);
      if (user) {
        isAdmin = user.role === "ADMIN";
        const cart = await prisma.cart.findFirst({
          where: { userId: user.id },
          include: { items: { select: { quantity: true } } },
        });
        if (cart) {
          cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        }
        wishlistCount = await prisma.wishlistItem.count({
          where: { userId: user.id },
        });
      }
    } catch (e) {
      console.error("Navbar data fetch failed:", e);
    }
  }

  return (
    <>
      <nav className="site-navbar" aria-label="Main navigation">
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          {/* ── Logo (left) ──────────────────────────────────────────────── */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
            aria-label="GVSwift home"
          >
            <Image
              src="/logo.png"
              alt="GVSwift Logo"
              width={140}
              height={32}
              style={{
                height: "32px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          </Link>

          {/* ── Centre nav links (desktop only) ──────────────────────────── */}
          {/* PDF p.1: COLLECTION · HERITAGE · STORES · JOURNAL, small caps */}
          <div className="navbar-desktop-links">
            {[
              { label: "New Arrivals", href: "/products?sort=newest" },
              { label: "Collections", href: "/products" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="navbar-center-link nav-link-hover"
                style={{
                  fontSize: "13px",
                  letterSpacing: "0.02em",
                  color: "var(--color-text-secondary)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Link>
            ))}
            <SearchBar />
          </div>

          {/* ── Right: icons + mobile hamburger ──────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {/* Wishlist heart icon (desktop) */}
            {isLoggedIn && (
              <Link
                href="/account/wishlist"
                aria-label="Wishlist"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  color: "var(--color-accent)",
                  position: "relative",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
                className="navbar-desktop-links"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {wishlistCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      width: "15px",
                      height: "15px",
                      borderRadius: "50%",
                      background: "var(--color-accent)",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Icons: account + cart */}
            <NavbarIconsAndSearch
              isLoggedIn={isLoggedIn}
              cartCount={cartCount}
              wishlistIcon={null}
            />

            {/* Mobile hamburger */}
            <MobileMenu
              isLoggedIn={isLoggedIn}
              isAdmin={isAdmin}
              cartCount={cartCount}
            />
          </div>
        </div>
      </nav>
    </>
  );
}