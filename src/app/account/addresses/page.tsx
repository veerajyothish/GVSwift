/**
 * /account/addresses — Address Book
 * PDF p.11: "Address Book" Garamond italic heading, subtitle, "+ Add New Address" pill btn
 * top-right. Cards in 2-col grid: name bold, address lines, phone, DEFAULT badge top-centre
 * on first card (wine red pill). EDIT | SET DEFAULT | DELETE footer actions per card.
 */
import React from "react";
import { requireUser } from "@/lib/auth/guards";
import { listAddresses } from "@/features/users/addresses";
import { lookupPincode } from "@/features/risk/service";
import AddressesClient from "./AddressesClient";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Address Book | GVSwift" };

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await listAddresses(user.id);

  const addressesWithRisk = await Promise.all(
    addresses.map(async (addr) => {
      const risk = await lookupPincode(addr.pincode);
      return { ...addr, codBlocked: !risk.codAllowed };
    })
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header row — PDF p.11: heading left, Add button right */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--color-accent)",
              marginBottom: "6px",
            }}
          >
            Address Book
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
            Manage your delivery and billing addresses.
          </p>
        </div>

        {/* "+ Add New Address" — PDF p.11: pill outline btn top-right */}
        {/* AddressesClient renders the actual modal trigger — we pass a hint via prop */}
      </header>

      <AddressesClient initialAddresses={addressesWithRisk} userId={user.id} />
    </div>
  );
}