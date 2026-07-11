import { requireUser } from "@/lib/auth/guards";
import SettingsForm from "./SettingsForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings — GVSwift",
};

export default async function SettingsPage() {
  const user = await requireUser();

  const preferences = (user.preferences as { orderUpdates?: boolean; promoEmails?: boolean }) || {
    orderUpdates: true,
    promoEmails: false,
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="mb-24">
        <h1 className="text-3xl mb-4 text-primary" style={{ fontFamily: "var(--font-heading)", fontWeight: 400 }}>
          Settings
        </h1>
        <p className="text-secondary">
          Manage your security settings, notification preferences, and account status.
        </p>
      </header>

      <SettingsForm email={user.email} initialPreferences={preferences} />
    </div>
  );
}
