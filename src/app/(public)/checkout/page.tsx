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

export const metadata: Metadata = {
  title: "Secure Checkout",
};

export default async function CheckoutPage() {
  // Ensure the user is logged in
  const user = await requireUser();

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
        />
      </main>
    </div>
  );
}
