import React from "react";
import { requireUser } from "@/lib/auth/guards";
import ProfileForm from "./ProfileForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
};

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto w-full px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-4 text-primary" style={{ fontFamily: "var(--font-heading)" }}>
          My Profile
        </h1>
        <p className="text-secondary">
          Update your contact details and account information.
        </p>
      </header>

      <ProfileForm
        initialUser={{
          name: user.name || "",
          email: user.email,
          phone: user.phone || "",
          createdAt: user.createdAt.toISOString(),
        }}
      />
    </div>
  );
}
