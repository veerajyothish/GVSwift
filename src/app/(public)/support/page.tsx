/**
 * /support
 *
 * Customer Support Tickets page — paginated/listed support tickets with form
 * to submit new ones.
 * Secured by requireUser(); only shows the current user's tickets.
 */

import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { listOwnTickets } from "@/features/support/service";
import { listUserOrders } from "@/features/orders/service";
import { Navbar } from "@/components/ui/Navbar";
import { SupportForm } from "./SupportForm";

export const metadata: Metadata = {
  title: "Support Tickets | GVSwift",
  description: "Get help with your orders or account support inquiries.",
};

const TICKET_STATUS_CONFIG: Record<string, { label: string; colorVar: string }> = {
  OPEN: { label: "Open", colorVar: "var(--color-info)" },
  IN_PROGRESS: { label: "In Progress", colorVar: "var(--color-warning)" },
  RESOLVED: { label: "Resolved", colorVar: "var(--color-success)" },
  CLOSED: { label: "Closed", colorVar: "var(--color-text-secondary)" },
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function SupportPage() {
  const user = await requireUser();

  const [tickets, ordersResult] = await Promise.all([
    listOwnTickets(user.id),
    listUserOrders(user.id, 1, 50),
  ]);

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}>
        <header style={{ marginBottom: "32px" }}>
          <h1
            className="text-3xl font-semibold"
            style={{ color: "var(--color-text-primary)", marginBottom: "8px" }}
          >
            Customer Support
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Need help? Open a support ticket or track your existing inquiries below.
          </p>
        </header>

        {/* 2-column layout: Form (left) + Tickets List (right) */}
        <div
          className="support-container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
            alignItems: "start",
          }}
        >
          {/* Create ticket form */}
          <div>
            <SupportForm orders={ordersResult.orders} />
          </div>

          {/* User's tickets list */}
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--color-text-primary)", marginBottom: "20px" }}
            >
              Your Tickets
            </h2>

            {tickets.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "var(--color-text-secondary)",
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>💬</div>
                <p style={{ fontSize: "15px" }}>You have not opened any support tickets yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {tickets.map((ticket) => {
                  const cfg = TICKET_STATUS_CONFIG[ticket.status] || {
                    label: ticket.status,
                    colorVar: "var(--color-text-secondary)",
                  };

                  return (
                    <Link
                      key={ticket.id}
                      href={`/support/${ticket.id}`}
                      className="card card-interactive"
                      style={{
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        textDecoration: "none",
                      }}
                      id={`ticket-${ticket.id}`}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "16px",
                        }}
                      >
                        <h3
                          className="font-medium"
                          style={{
                            color: "var(--color-text-primary)",
                            fontSize: "16px",
                            lineHeight: "1.4",
                          }}
                        >
                          {ticket.subject}
                        </h3>
                        <span
                          className="status-badge"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: "12px",
                            fontWeight: "500",
                            padding: "4px 8px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid",
                            backgroundColor: `color-mix(in srgb, ${cfg.colorVar} 15%, transparent)`,
                            color: cfg.colorVar,
                            borderColor: `color-mix(in srgb, ${cfg.colorVar} 25%, transparent)`,
                            textTransform: "capitalize",
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          fontSize: "13px",
                          color: "var(--color-text-secondary)",
                          borderTop: "1px solid var(--color-border)",
                          paddingTop: "12px",
                        }}
                      >
                        <div>
                          <span>Opened: {formatDate(ticket.createdAt)}</span>
                          {ticket.orderId && (
                            <span style={{ marginLeft: "12px" }}>
                              Order: #{ticket.orderId.slice(0, 8)}
                            </span>
                          )}
                        </div>
                        <span style={{ color: "var(--color-accent)", display: "flex", alignItems: "center" }}>
                          View Thread &rarr;
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
