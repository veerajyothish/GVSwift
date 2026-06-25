import React from "react";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NavbarLogoutButton } from "@/components/ui/NavbarLogoutButton";

/**
 * Server Component that checks Supabase session and renders
 * appropriate nav links based on auth state.
 *
 * Logged out: Shop | Login | Sign up
 * Logged in:  Shop | Cart | Orders | Support | Logout
 * Admin:      Shop | Cart | Orders | Admin | Logout
 */
export async function NavbarAuthLinks() {
  const session = await getServerSession();

  if (!session) {
    // Logged out state
    return (
      <div className="site-navbar-links">
        <Link href="/products" className="site-navbar-link">
          Shop
        </Link>
        <Link href="/login" className="site-navbar-link">
          Sign In
        </Link>
        <Link
          href="/signup"
          className="site-navbar-link"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            fontSize: "13px",
          }}
        >
          Create Account
        </Link>
      </div>
    );
  }

  // Check if admin
  let isAdmin = false;
  try {
    const user = await prisma.user.findUnique({
      where: { supabaseId: session.id },
      select: { role: true },
    });
    isAdmin = user?.role === "ADMIN";
  } catch {
    // If DB check fails, treat as regular user
  }

  // Logged in state
  return (
    <div className="site-navbar-links">
      <Link href="/products" className="site-navbar-link">
        Shop
      </Link>
      <Link href="/cart" className="site-navbar-link">
        Cart
      </Link>
      <Link href="/account/orders" className="site-navbar-link">
        Orders
      </Link>
      {isAdmin && (
        <Link
          href="/admin"
          className="site-navbar-link"
          style={{ color: "var(--color-accent)", fontWeight: 600 }}
        >
          Admin
        </Link>
      )}
      <NavbarLogoutButton />
    </div>
  );
}
