/**
 * /account — Account Dashboard redirect page
 * Shows a quick profile summary card and redirects intent to /account/profile.
 * PDF p.12: profile details + recent orders shown on same page.
 */
import React from "react";
import { requireUser } from "@/lib/auth/guards";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  // Redirect immediately to profile — the layout handles the full page UI
  redirect("/account/profile");
}