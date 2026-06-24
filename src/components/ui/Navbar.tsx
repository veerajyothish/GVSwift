import React from "react";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { MobileMenu } from "./MobileMenu";
import { NavbarIconsAndSearch } from "./NavbarIconsAndSearch";

export async function Navbar() {
  const session = await getServerSession();
  
  let isLoggedIn = false;
  let isAdmin = false;
  let cartCount = 0;

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
          include: {
            items: {
              select: { quantity: true },
            },
          },
        });
        
        if (cart) {
          cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        }
      }
    } catch (e) {
      console.error("Failed to query auth/cart data for navbar:", e);
    }
  }

  return (
    <nav className="site-navbar" aria-label="Main navigation">
      <div className="site-navbar-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Left Zone: Logo */}
        <div className="navbar-left-zone">
          <Link href="/" className="site-navbar-brand">
            <span className="site-navbar-logo" style={{ fontStyle: "italic", fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "28px" }}>GVSwift</span>
          </Link>
        </div>

        {/* Center Zone: Nav links (Desktop) or Hamburger Menu (Mobile) */}
        <div className="navbar-center-zone">
          {/* Desktop Nav Links */}
          <div className="navbar-desktop-links" style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <Link href="/products" className="navbar-center-link">
              NEW ARRIVALS
            </Link>
            <Link href="/products" className="navbar-center-link">
              COLLECTIONS
            </Link>
            <Link href="/faq" className="navbar-center-link">
              FAQ
            </Link>
            <Link href="/support" className="navbar-center-link">
              SUPPORT
            </Link>
          </div>
          
          {/* Mobile Hamburger Drawer */}
          <MobileMenu isLoggedIn={isLoggedIn} isAdmin={isAdmin} cartCount={cartCount} />
        </div>

        {/* Right Zone: Icons (Search, Wishlist, Profile, Cart) */}
        <div className="navbar-right-zone">
          <NavbarIconsAndSearch isLoggedIn={isLoggedIn} cartCount={cartCount} />
        </div>

      </div>
    </nav>
  );
}
