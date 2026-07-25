/**
 * /cart — Shopping Cart Page
 * PDF: cream bg, Garamond italic heading, cart grid (items left, summary right),
 * pill CTA "Proceed to Checkout", items list with thumb + stepper + remove.
 */
import React from "react";
import { getUser } from "@/lib/auth/guards";
import { getCart } from "@/features/cart/service";
import CartPageClient from "./CartPageClient";
import { Metadata } from "next";
import Link from "next/link";
import BackButton from "@/components/ui/BackButton";

export const metadata: Metadata = { title: "Shopping Cart | GVSwift" };

export default async function CartPage() {
  const user = await getUser();
  if (!user) {
    return (
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px 80px", minHeight: "60vh" }}>
        <BackButton />
        <header style={{ marginBottom: "36px" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 400, fontStyle: "italic", color: "var(--color-accent)", marginBottom: "8px", lineHeight: 1.1 }}>Shopping Cart</h1>
        </header>
        <div style={{ padding: "48px 24px", textAlign: "center", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🛒</div>
          <p style={{ fontSize: "16px", color: "var(--color-text-secondary)", marginBottom: "24px" }}>Your cart is empty. Please sign in to view your items.</p>
          <Link href="/login" style={{ display: "inline-block", background: "var(--color-accent)", color: "#fff", padding: "12px 24px", borderRadius: "99px", textDecoration: "none", fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    );
  }
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
      <BackButton />
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