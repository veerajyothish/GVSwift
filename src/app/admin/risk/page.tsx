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
    <div className="flex flex-col gap-5">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            Risk & Fraud Rules
          </h1>
          <p className="text-secondary">
            Manage serviceability and COD restrictions for specific pincodes, phone numbers, addresses, or users.
          </p>
        </div>
      </header>

      <RiskManager initialData={initialData} />
    </div>
  );
}
