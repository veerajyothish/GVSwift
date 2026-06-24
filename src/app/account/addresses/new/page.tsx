import React from "react";
import { requireUser } from "@/lib/auth/guards";
import AddressForm from "../AddressForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add New Address",
};

export default async function NewAddressPage() {
  // Enforce session check
  await requireUser();

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto w-full px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-4 text-primary" style={{ fontFamily: "var(--font-heading)" }}>
          Add New Address
        </h1>
        <p className="text-secondary">
          Enter your shipping details below.
        </p>
      </header>

      <AddressForm />
    </div>
  );
}
