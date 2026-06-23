/**
 * /support/[ticketId]
 *
 * Customer Support Ticket Details Page — displays ticket summary, description,
 * message thread, and reply box.
 * Secured by requireUser(); only allows viewing owned tickets (IDOR protection).
 */

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getOwnTicketDetail } from "@/features/support/service";
import { Navbar } from "@/components/ui/Navbar";
import { SupportReplyForm } from "./SupportReplyForm";
import { AppError } from "@/lib/errors";

interface PageProps {
  params: Promise<{ ticketId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { ticketId } = await params;
  return {
    title: `Ticket Details #${ticketId.slice(0, 8)} | GVSwift`,
  };
}

const TICKET_STATUS_CONFIG: Record<string, { label: string; colorVar: string }> = {
  OPEN: { label: "Open", colorVar: "var(--color-info)" },
  IN_PROGRESS: { label: "In Progress", colorVar: "var(--color-warning)" },
  RESOLVED: { label: "Resolved", colorVar: "var(--color-success)" },
  CLOSED: { label: "Closed", colorVar: "var(--color-text-secondary)" },
};

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function TicketDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const { ticketId } = await params;

  let ticket;
  try {
    ticket = await getOwnTicketDetail(user.id, ticketId);
  } catch (err) {
    if (err instanceof AppError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const isTerminal = ticket.status === "CLOSED" || ticket.status === "RESOLVED";
  const cfg = TICKET_STATUS_CONFIG[ticket.status] || {
    label: ticket.status,
    colorVar: "var(--color-text-secondary)",
  };

  return (
    <div className="min-h-screen bg-default">
      <Navbar />

      <main className="container-sm">
        {/* Breadcrumb */}
        <nav className="order-breadcrumb mb-24" aria-label="Breadcrumb">
          <Link href="/support" className="order-breadcrumb-link">
            Support Tickets
          </Link>
          <span className="order-breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <span className="order-breadcrumb-current">Ticket Details</span>
        </nav>

        {/* Ticket Info Card */}
        <section className="card p-5 mb-32">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-xs-mono text-secondary">
                Ticket ID: {ticket.id}
              </span>
              <h1 className="text-2xl font-semibold text-primary mt-4 mb-8" style={{ lineHeight: "1.3" }}>
                {ticket.subject}
              </h1>
              <p className="text-xs text-secondary">
                Opened on {formatDateTime(ticket.createdAt)}
                {ticket.orderId && (
                  <>
                    {" · "}
                    <Link
                      href={`/orders/${ticket.orderId}`}
                      className="text-accent underline"
                    >
                      Related Order #{ticket.orderId.slice(0, 8)}
                    </Link>
                  </>
                )}
              </p>
            </div>

            <span
              className="status-badge status-badge-lg"
              style={{
                backgroundColor: `color-mix(in srgb, ${cfg.colorVar} 15%, transparent)`,
                color: cfg.colorVar,
                borderColor: `color-mix(in srgb, ${cfg.colorVar} 25%, transparent)`,
              }}
            >
              {cfg.label}
            </span>
          </div>

          <div className="ticket-section-divider">
            <h3 className="ticket-field-label">
              Description
            </h3>
            {ticket.description ? (
              <div className="ticket-description-box">
                {ticket.description}
              </div>
            ) : (
              <p className="italic text-secondary text-sm">
                No description provided.
              </p>
            )}
          </div>
        </section>

        {/* Message Thread Section */}
        <section>
          <h2 className="text-lg font-semibold text-primary mb-20">
            Conversation Thread
          </h2>

          <div className="message-thread message-thread-container">
            {ticket.messages.length === 0 ? (
              <div className="text-center text-secondary py-20 text-sm italic">
                No messages yet. Send a message to start the conversation.
              </div>
            ) : (
              ticket.messages.map((msg) => {
                const isCustomer = msg.authorId === user.id;

                return (
                  <div
                    key={msg.id}
                    className="flex w-full"
                    style={{
                      justifyContent: isCustomer ? "flex-end" : "flex-start",
                    }}
                  >
                    <div className={`message-bubble ${isCustomer ? "message-bubble-customer" : "message-bubble-agent"}`}>
                      <div className="message-bubble-header">
                        <span>{isCustomer ? "You" : "Support Agent"}</span>
                        <span>{formatDateTime(msg.createdAt)}</span>
                      </div>
                      <div className="message-bubble-content">
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Reply Input Form */}
            <SupportReplyForm
              ticketId={ticket.id}
              isTerminalStatus={isTerminal}
              statusLabel={cfg.label}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
