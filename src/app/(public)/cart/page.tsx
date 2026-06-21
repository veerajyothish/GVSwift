/**
 * /cart
 *
 * Public Shopping Cart Page. Secured by requireUser() — anonymous cart not supported.
 */

import React from "react";
import { requireUser } from "@/lib/auth/guards";
import { getCart } from "@/features/cart/service";
import CartPageClient from "./CartPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart",
};

export default async function CartPage() {
  // Ensure the user is logged in
  const user = await requireUser();

  // Load user's cart from database
  // The service automatically handles mapping and includes product/variant/images details.
  const cart = await getCart(user.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", minHeight: "60vh" }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-primary)", marginBottom: "8px" }}>
          Shopping Cart
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Review your items and proceed to secure checkout.
        </p>
      </header>

      <CartPageClient initialCart={cart} />
    </div>
  );
}
