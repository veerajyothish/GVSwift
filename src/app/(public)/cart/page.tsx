/**
 * /cart — Shopping Cart Page
 * PDF: cream bg, Garamond italic heading, cart grid (items left, summary right),
 * pill CTA "Proceed to Checkout", items list with thumb + stepper + remove.
 */
import React from "react";
import { requireUser } from "@/lib/auth/guards";
import { getCart } from "@/features/cart/service";
import CartPageClient from "./CartPageClient";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Shopping Cart | GVSwift" };

export default async function CartPage() {
  const user = await requireUser();
  const cart = await getCart(user.id);

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "48px 24px 80px",
        minHeight: "60vh",
      }}
    >
      <header style={{ marginBottom: "36px" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--color-accent)",
            marginBottom: "8px",
            lineHeight: 1.1,
          }}
        >
          Shopping Cart
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
          Review your items and proceed to secure checkout.
        </p>
      </header>

      <CartPageClient initialCart={cart} />
    </div>
  );
}