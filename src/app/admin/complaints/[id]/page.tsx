/**
 * src/app/admin/complaints/[id]/page.tsx
 *
 * Admin support ticket detail page.
 * Loads ticket data server-side and renders ComplaintDetailManager.
 */

import React from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getTicketDetail } from "@/features/support/admin-service";
import ComplaintDetailManager from "./ComplaintDetailManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complaint Details | GVSwift",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminComplaintDetailPage({ params }: PageProps) {
  // Enforces admin permissions on the server
  await requireAdmin();
  const { id } = await params;

  let ticket;
  try {
    ticket = await getTicketDetail(id);
  } catch {
    notFound();
  }

  return <ComplaintDetailManager initialTicket={ticket} />;
}
