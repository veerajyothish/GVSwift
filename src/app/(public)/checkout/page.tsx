/**
 * /checkout — Secure Checkout Page
 * Layout redesigned to match PDF p.13/14: centered GVSWIFT wordmark top,
 * two-column grid (shipping+payment left, order summary right), pill inputs,
 * COD selected by default with wine-red border, CONFIRM ORDER → pill CTA bottom.
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
  title: "Secure Checkout | GVSwift",
};

export default async function CheckoutPage() {
  const user = await requireUser();
  const session = await getServerSession();
  const isVerified = !!session?.email_confirmed_at;

  /* ── Email not verified ─────────────────────────────────────────────────── */
  if (!isVerified) {
    return (
      <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
        <Navbar />
        <main
          style={{
            maxWidth: "560px",
            margin: "80px auto 40px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "48px 40px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ fontSize: "48px" }}>🔒</div>
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "26px",
                  fontStyle: "italic",
                  color: "var(--color-accent)",
                  marginBottom: "12px",
                }}
              >
                Verify Your Email to Checkout
              </h1>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.65,
                  fontSize: "15px",
                }}
              >
                To proceed with your order, please verify your email address.
                This helps us secure your account and send order updates.
              </p>
            </div>
            <div style={{ width: "100%", textAlign: "left" }}>
              <VerificationBanner email={user.email} isVerified={false} />
            </div>
            <a
              href="/cart"
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              ← Return to Cart
            </a>
          </div>
        </main>
      </div>
    );
  }

  /* ── Load checkout data ─────────────────────────────────────────────────── */
  const [cart, addresses, codLimitPaise, loyaltyAccount, loyaltySettings] =
    await Promise.all([
      getCart(user.id),
      listAddresses(user.id),
      getCodLimitPaise(),
      getOrCreateLoyaltyAccount(user.id),
      getLoyaltySettings(),
    ]);

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  const addressesWithRisk = await Promise.all(
    addresses.map(async (addr) => {
      const [pincodeRisk, phoneRisk, addressRisk, userRisk] = await Promise.all(
        [
          lookupPincode(addr.pincode),
          lookupPhone(addr.phone),
          lookupAddress(addr.id),
          lookupUser(user.id),
        ]
      );
      const riskChecks = [
        { result: pincodeRisk },
        { result: phoneRisk },
        { result: addressRisk },
        { result: userRisk },
      ];
      let isCodBlocked = false;
      const isServiceable = pincodeRisk.serviceable;
      let requiresApproval = false;
      for (const { result } of riskChecks) {
        if (result.found && result.riskLevel === "BLOCKED") isCodBlocked = true;
        if (result.requiresApproval) requiresApproval = true;
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

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      {/* PDF p.13: top GVSWIFT wordmark centred, thin border below */}
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          padding: "20px 24px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "var(--color-accent)",
            fontStyle: "italic",
          }}
        >
          GVSWIFT
        </span>
      </header>

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        {/* PDF p.13: "① Shipping Information" section label above form */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "var(--color-accent)",
              color: "var(--color-accent-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            1
          </span>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "22px",
              fontStyle: "italic",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Shipping Information
          </h1>
        </div>

        <CheckoutClient
          initialCart={cart}
          initialAddresses={addressesWithRisk}
          codLimitPaise={codLimitPaise}
          loyaltyBalance={loyaltyAccount.balance}
          loyaltySettings={{
            rupeesPer100Points: loyaltySettings.rupeesPer100Points,
          }}
        />
      </main>

      {/* PDF p.14: minimal GVSWIFT footer wordmark */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "20px 24px",
          textAlign: "center",
          background: "var(--color-surface)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--color-text-secondary)",
          }}
        >
          GVSWIFT
        </span>
      </footer>
    </div>
  );
}