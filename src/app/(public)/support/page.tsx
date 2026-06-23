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
    <div className="min-h-screen bg-default">
      <Navbar />

      <main className="container-lg">
        <header className="mb-32">
          <h1 className="text-3xl font-semibold text-primary mb-8">
            Customer Support
          </h1>
          <p className="text-secondary">
            Need help? Open a support ticket or track your existing inquiries below.
          </p>
        </header>

        {/* 2-column layout: Form (left) + Tickets List (right) */}
        <div className="support-grid">
          {/* Create ticket form */}
          <div>
            <SupportForm orders={ordersResult.orders} />
          </div>

          {/* User's tickets list */}
          <div>
            <h2 className="text-lg font-semibold text-primary mb-20">
              Your Tickets
            </h2>

            {tickets.length === 0 ? (
              <div className="card p-5 text-center text-secondary">
                <div className="mb-16" style={{ fontSize: "40px" }}>💬</div>
                <p className="text-15">You have not opened any support tickets yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {tickets.map((ticket) => {
                  const cfg = TICKET_STATUS_CONFIG[ticket.status] || {
                    label: ticket.status,
                    colorVar: "var(--color-text-secondary)",
                  };

                  return (
                    <Link
                      key={ticket.id}
                      href={`/support/${ticket.id}`}
                      className="card card-interactive ticket-card"
                      id={`ticket-${ticket.id}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-medium text-primary text-base lh-1-4">
                          {ticket.subject}
                        </h3>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${cfg.colorVar} 15%, transparent)`,
                            color: cfg.colorVar,
                            borderColor: `color-mix(in srgb, ${cfg.colorVar} 25%, transparent)`,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      <div className="ticket-card-footer">
                        <div>
                          <span>Opened: {formatDate(ticket.createdAt)}</span>
                          {ticket.orderId && (
                            <span className="ml-12">
                              Order: #{ticket.orderId.slice(0, 8)}
                            </span>
                          )}
                        </div>
                        <span className="text-accent flex items-center">
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
