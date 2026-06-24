import React from "react";
import { requireUser } from "@/lib/auth/guards";
import { getAddress } from "@/features/users/addresses";
import AddressForm from "../../AddressForm";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Address",
};

interface EditAddressPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAddressPage({ params }: EditAddressPageProps) {
  // Enforce session check
  const user = await requireUser();
  const { id } = await params;

  let address;
  try {
    address = await getAddress(user.id, id);
  } catch {
    // If not found or not owned, return 404 per security guidelines
    notFound();
  }

  const initialData = {
    fullName: address.fullName,
    phone: address.phone,
    pincode: address.pincode,
    line1: address.line1,
    line2: address.line2 || "",
    city: address.city,
    state: address.state,
    isDefault: address.isDefault,
  };

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto w-full px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-4 text-primary" style={{ fontFamily: "var(--font-heading)" }}>
          Edit Address
        </h1>
        <p className="text-secondary">
          Update your shipping details below.
        </p>
      </header>

      <AddressForm initialData={initialData} addressId={address.id} />
    </div>
  );
}
