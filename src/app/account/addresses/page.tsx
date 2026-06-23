/**
 * /account/addresses
 *
 * User Address Management Page. Secured by requireUser().
 */

import React from "react";
import { requireUser } from "@/lib/auth/guards";
import { listAddresses } from "@/features/users/addresses";
import { lookupPincode } from "@/features/risk/service";
import AddressesClient from "./AddressesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Address Book",
};

export default async function AddressesPage() {
  // Enforce session check
  const user = await requireUser();

  // Load user's addresses
  const addresses = await listAddresses(user.id);

  // Pre-calculate COD blocked status for each address based on its pincode
  const addressesWithRisk = await Promise.all(
    addresses.map(async (addr) => {
      const risk = await lookupPincode(addr.pincode);
      return {
        ...addr,
        codBlocked: !risk.codAllowed,
      };
    })
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="mb-24">
        <h1 className="text-3xl font-semibold mb-4 text-primary">
          Address Book
        </h1>
        <p className="text-secondary">
          Manage your shipping addresses. Your default address will be pre-selected at checkout.
        </p>
      </header>

      <AddressesClient initialAddresses={addressesWithRisk} userId={user.id} />
    </div>
  );
}
