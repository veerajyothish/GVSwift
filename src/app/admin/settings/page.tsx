/**
 * /admin/settings
 *
 * System configurations editor dashboard. Secured by requireAdmin().
 */

import React from "react";
import { getAllSettings } from "@/features/settings/service";
import SettingsForm from "./SettingsForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings Console",
};

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-primary)", marginBottom: "8px" }}>
          System Settings
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Manage global application parameters, boundaries, thresholds, and cutoff rules.
        </p>
      </header>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
