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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
          Complaint & Ticket Management
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Respond to customer complaints, add internal notes, and manage ticket lifecycle.
        </p>
      </header>

      {/* Status Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "12px",
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
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: isActive ? "var(--color-accent)" : "var(--color-surface)",
                color: isActive ? "var(--color-accent-text)" : "var(--color-text-primary)",
                border: "1px solid",
                borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tickets List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {tickets.length === 0 ? (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              color: "var(--color-text-secondary)",
            }}
          >
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
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  transition: "border-color 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <Link
                      href={`/admin/complaints/${ticket.id}`}
                      style={{
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        textDecoration: "none",
                      }}
                    >
                      {ticket.subject}
                    </Link>
                    <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      Customer: {ticket.user?.email || "Guest User"}
                    </span>
                  </div>

                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      border: "1px solid",
                      ...badge,
                    }}
                  >
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    color: "var(--color-text-secondary)",
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "12px",
                    marginTop: "4px",
                  }}
                >
                  <div>
                    {ticket.orderId ? (
                      <Link
                        href={`/admin/orders/${ticket.orderId}`}
                        style={{
                          color: "var(--color-accent)",
                          fontWeight: 500,
                        }}
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
