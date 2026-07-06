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
              width={240}
              height={56}
              style={{
                height: "56px",
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
              { label: "Shops", href: "/shops" },
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