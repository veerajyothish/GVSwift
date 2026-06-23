import React from "react";
import { requireUser } from "@/lib/auth/guards";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Dashboard",
};

export default async function AccountPage() {
  const user = await requireUser();

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Guarded phone field check
  const phoneVal = "phone" in user ? (user as { phone?: string | null }).phone : undefined;

  return (
    <div className="flex flex-col gap-5">
      <header className="mb-24">
        <h1 className="text-3xl font-semibold mb-4 text-primary">
          Profile Dashboard
        </h1>
        <p className="text-secondary">
          Manage your account information and preferences.
        </p>
      </header>

      <div className="card p-6 flex flex-col gap-4 max-w-xl">
        <div className="border-b border-color-border pb-3 mb-2" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "12px", marginBottom: "8px" }}>
          <h2 className="text-lg font-semibold text-primary">Profile Details</h2>
          <p className="text-xs text-secondary">
            Your login and contact information.
          </p>
        </div>

        <div className="flex flex-col">
          <div className="profile-row">
            <span className="text-sm font-medium text-secondary">Email Address</span>
            <span className="text-sm font-semibold text-primary">{user.email}</span>
          </div>

          <div className="profile-row">
            <span className="text-sm font-medium text-secondary">Phone Number</span>
            <span className="text-sm font-semibold text-primary">{phoneVal || "Not provided"}</span>
          </div>

          <div className="profile-row">
            <span className="text-sm font-medium text-secondary">Member Since</span>
            <span className="text-sm font-semibold text-primary">{memberSince}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
