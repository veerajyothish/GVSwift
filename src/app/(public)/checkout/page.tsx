/**
 * /checkout
 *
 * Secure Checkout Page. Secured by requireUser() — anonymous checkout not supported.
 */

import React from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getCart } from "@/features/cart/service";
import { listAddresses } from "@/features/users/addresses";
import {
  lookupPincode,
  lookupPhone,
  lookupAddress,
  lookupUser,
} from "@/features/risk/service";
import { getCodLimitPaise } from "@/features/settings/service";
import { Navbar } from "@/components/ui/Navbar";
import CheckoutClient from "./CheckoutClient";
import { Metadata } from "next";
import { getOrCreateLoyaltyAccount, getLoyaltySettings } from "@/lib/loyalty";

import { getServerSession } from "@/lib/auth/session";
import { VerificationBanner } from "@/components/ui/VerificationBanner";

export const metadata: Metadata = {
  title: "Secure Checkout",
};

export default async function CheckoutPage() {
  // Ensure the user is logged in
  const user = await requireUser();
  
  // Check email verification status
  const session = await getServerSession();
  const isVerified = !!session?.email_confirmed_at;

  if (!isVerified) {
    return (
      <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
        <Navbar />
        <main style={{ maxWidth: "600px", margin: "80px auto 40px", padding: "0 20px" }}>
          <div
            className="card"
            style={{
              padding: "40px",
              textAlign: "center",
              borderRadius: "var(--radius-lg, 12px)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-bg-card)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <div style={{ fontSize: "48px" }}>🔒</div>
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-heading, 'EB Garamond', serif)",
                  fontSize: "28px",
                  color: "var(--color-primary)",
                  marginBottom: "12px",
                }}
              >
                Checkout is Locked
              </h1>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: "1.6", fontSize: "15px" }}>
                To proceed with your order, please verify your email address. This helps us secure your account and send order tracking updates.
              </p>
            </div>
            
            <div style={{ width: "100%", textAlign: "left" }}>
              <VerificationBanner email={user.email} isVerified={false} />
            </div>

            <a
              href="/cart"
              className="btn btn-secondary"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                minHeight: "44px",
              }}
            >
              ← Return to Cart
            </a>
          </div>
        </main>
      </div>
    );
  }

  // Load user's cart from database
  const cart = await getCart(user.id);

  // If cart is empty or null, redirect back to cart page
  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  // Load user's addresses
  const addresses = await listAddresses(user.id);

  // Pre-calculate serviceability, COD blocked status, and approval requirements for each address
  const addressesWithRisk = await Promise.all(
    addresses.map(async (addr) => {
      const [pincodeRisk, phoneRisk, addressRisk, userRisk] = await Promise.all([
        lookupPincode(addr.pincode),
        lookupPhone(addr.phone),
        lookupAddress(addr.id),
        lookupUser(user.id),
      ]);

      const riskChecks = [
        { result: pincodeRisk, label: "pincode" },
        { result: phoneRisk,   label: "phone number" },
        { result: addressRisk, label: "address" },
        { result: userRisk,    label: "account" },
      ];

      let isCodBlocked = false;
      const isServiceable = pincodeRisk.serviceable;
      let requiresApproval = false;

      for (const { result } of riskChecks) {
        if (result.found && result.riskLevel === "BLOCKED") {
          isCodBlocked = true;
        }
        if (result.requiresApproval) {
          requiresApproval = true;
        }
      }

      return {
        id: addr.id,
        fullName: addr.fullName,
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        phone: addr.phone,
        isDefault: addr.isDefault,
        isCodBlocked,
        isServiceable,
        requiresApproval,
      };
    })
  );

  // Get the current COD limit
  const codLimitPaise = await getCodLimitPaise();

  // B12: Fetch loyalty balance and settings for the redeem toggle
  const [loyaltyAccount, loyaltySettings] = await Promise.all([
    getOrCreateLoyaltyAccount(user.id),
    getLoyaltySettings(),
  ]);
  const loyaltyBalance = loyaltyAccount.balance;

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        <header style={{ marginBottom: "32px" }}>
          <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-primary)", marginBottom: "8px" }}>
            Secure Checkout
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Review your order and select your shipping address.
          </p>
        </header>

        <CheckoutClient
          initialCart={cart}
          initialAddresses={addressesWithRisk}
          codLimitPaise={codLimitPaise}
          loyaltyBalance={loyaltyBalance}
          loyaltySettings={{ rupeesPer100Points: loyaltySettings.rupeesPer100Points }}
        />
      </main>
    </div>
  );
}
