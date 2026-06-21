/**
 * /admin/risk
 *
 * Risk and fraud rule management dashboard. Secured by requireAdmin().
 */

import React from "react";
import { listRiskFlags } from "@/features/risk/service";
import RiskManager from "./RiskManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Console",
};

export default async function AdminRiskPage() {
  // Load initial page 1
  const initialData = await listRiskFlags({ page: 1, limit: 20 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-primary)", marginBottom: "8px" }}>
          Risk & Fraud Rules
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Manage serviceability and COD restrictions for specific pincodes, phone numbers, addresses, or users.
        </p>
      </header>

      <RiskManager initialData={initialData} />
    </div>
  );
}
