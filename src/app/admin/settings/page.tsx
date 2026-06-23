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
    <div className="flex flex-col gap-5">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            System Settings
          </h1>
          <p className="text-secondary">
            Manage global application parameters, boundaries, thresholds, and cutoff rules.
          </p>
        </div>
      </header>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
