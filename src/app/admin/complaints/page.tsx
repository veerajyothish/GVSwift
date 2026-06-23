/**
 * src/app/admin/complaints/page.tsx
 *
 * Admin support tickets listing page.
 * Filterable by status using tabs.
 * Persists status selection in URL query parameters.
 */

import React from "react";
import { requireAdmin } from "@/lib/auth/guards";
import { listAllTickets } from "@/features/support/admin-service";
import { TicketStatus } from "@prisma/client";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Complaint Management | GVSwift",
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

const TABS = [
  { label: "All Tickets", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
];

function getStatusBadgeStyle(status: TicketStatus) {
  switch (status) {
    case TicketStatus.OPEN:
      return {
        color: "var(--color-info)",
        backgroundColor: "var(--color-info-bg)",
        borderColor: "var(--color-info)",
      };
    case TicketStatus.IN_PROGRESS:
      return {
        color: "var(--color-warning)",
        backgroundColor: "var(--color-warning-bg)",
        borderColor: "var(--color-warning)",
      };
    case TicketStatus.RESOLVED:
      return {
        color: "var(--color-success)",
        backgroundColor: "var(--color-success-bg)",
        borderColor: "var(--color-success)",
      };
    case TicketStatus.CLOSED:
      return {
        color: "var(--color-text-secondary)",
        backgroundColor: "rgba(160, 160, 155, 0.1)",
        borderColor: "var(--color-border)",
      };
    default:
      return {};
  }
}

export default async function AdminComplaintsPage({ searchParams }: PageProps) {
  // Enforces admin permissions on the server
  await requireAdmin();

  const resolvedParams = await searchParams;
  const statusParam = resolvedParams.status?.toUpperCase();
  const activeStatus = Object.values(TicketStatus).includes(statusParam as TicketStatus)
    ? (statusParam as TicketStatus)
    : undefined;

  const tickets = await listAllTickets(activeStatus ? { status: activeStatus } : undefined);

  return (
    <div className="flex flex-col gap-5">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            Complaint & Ticket Management
          </h1>
          <p className="text-secondary text-sm mt-2">
            Respond to customer complaints, add internal notes, and manage ticket lifecycle.
          </p>
        </div>
      </header>

      {/* Status Tabs */}
      <div
        className="flex gap-2 pb-3 mb-4"
        style={{
          borderBottom: "1px solid var(--color-border)",
          overflowX: "auto",
        }}
      >
        {TABS.map((tab) => {
          const isActive = resolvedParams.status === tab.value || (!resolvedParams.status && tab.value === "ALL");
          const href = tab.value === "ALL" ? "/admin/complaints" : `/admin/complaints?status=${tab.value}`;

          return (
            <Link
              key={tab.value}
              href={href}
              className={isActive ? "category-link-active" : "category-link"}
              style={{ whiteSpace: "nowrap" }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tickets List */}
      <div className="flex flex-col gap-4">
        {tickets.length === 0 ? (
          <div className="card p-6 text-center text-secondary py-20">
            No tickets found matching this filter.
          </div>
        ) : (
          tickets.map((ticket) => {
            const badge = getStatusBadgeStyle(ticket.status);
            const formattedDate = new Date(ticket.updatedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={ticket.id}
                className="card p-5 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/admin/complaints/${ticket.id}`}
                      className="text-lg font-semibold text-primary"
                    >
                      {ticket.subject}
                    </Link>
                    <span className="text-secondary text-13">
                      Customer: {ticket.user?.email || "Guest User"}
                    </span>
                  </div>

                  <span
                    className="status-badge"
                    style={{
                      ...badge,
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>

                <div
                  className="flex justify-between items-center text-secondary text-13 mt-2"
                  style={{
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "12px",
                  }}
                >
                  <div>
                    {ticket.orderId ? (
                      <Link
                        href={`/admin/orders/${ticket.orderId}`}
                        className="text-accent font-medium"
                      >
                        Order Details
                      </Link>
                    ) : (
                      <span>General Inquiry (No order linked)</span>
                    )}
                  </div>

                  <div>Last Updated: {formattedDate}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
