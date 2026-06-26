import React from "react";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { MobileMenu } from "./MobileMenu";
import { NavbarIconsAndSearch } from "./NavbarIconsAndSearch";
import BannerBar from "./BannerBar";
import SearchBar from "./SearchBar";

export async function Navbar() {
  const session = await getServerSession();

  let isLoggedIn = false;
  let isAdmin = false;
  let cartCount = 0;
  let wishlistCount = 0;

  if (session) {
    isLoggedIn = true;
    try {
      const user = await prisma.user.findUnique({
        where: { supabaseId: session.id },
        select: { id: true, role: true },
      });

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
      console.error("Failed to query auth/cart/wishlist data for navbar:", e);
    }
  }

  return (
    <>
      {/* ── Banner: sticky at the very top of the page, above the navbar ── */}
      <BannerBar />

      <nav className="site-navbar" aria-label="Main navigation">
        <div
          className="site-navbar-inner"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Left Zone: Logo */}
          <div className="navbar-left-zone">
            <Link href="/" className="site-navbar-brand">
              <span
                className="site-navbar-logo"
                style={{
                  fontStyle: "italic",
                  fontFamily: "var(--font-heading)",
                  color: "var(--color-primary)",
                  fontSize: "28px",
                }}
              >
                GVSwift
              </span>
            </Link>
          </div>

          {/* Center Zone: Nav links (Desktop) or Hamburger Menu (Mobile) */}
          <div className="navbar-center-zone">
            <div
              className="navbar-desktop-links"
              style={{ display: "flex", alignItems: "center", gap: "24px" }}
            >
              <Link href="/products" className="navbar-center-link">SHOP</Link>
              <Link href="/categories" className="navbar-center-link">CATEGORIES</Link>
              <Link href="/faq" className="navbar-center-link">FAQ</Link>
              <Link href="/support" className="navbar-center-link">SUPPORT</Link>
              <SearchBar />
            </div>
            <MobileMenu isLoggedIn={isLoggedIn} isAdmin={isAdmin} cartCount={cartCount} />
          </div>

          {/* Right Zone: Icons */}
          <div className="navbar-right-zone">
            <NavbarIconsAndSearch
              isLoggedIn={isLoggedIn}
              cartCount={cartCount}
              wishlistIcon={
                <Link
                  href="/account/wishlist"
                  className="navbar-icon-btn relative"
                  aria-label="Wishlist"
                  style={{
                    color: "var(--color-primary)",
                    padding: "4px",
                    display: "inline-flex",
                    alignItems: "center",
                    position: "relative",
                  }}
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
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {wishlistCount > 0 && (
                    <span
                      className="wishlist-badge"
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
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              }
            />
          </div>
        </div>
      </nav>
    </>
  );
}
