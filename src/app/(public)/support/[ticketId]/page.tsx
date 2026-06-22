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
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Breadcrumb */}
        <nav className="order-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: "24px" }}>
          <Link href="/support" className="order-breadcrumb-link">
            Support Tickets
          </Link>
          <span className="order-breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <span className="order-breadcrumb-current">Ticket Details</span>
        </nav>

        {/* Ticket Info Card */}
        <section className="card" style={{ padding: "24px", marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                }}
              >
                Ticket ID: {ticket.id}
              </span>
              <h1
                className="text-2xl font-semibold"
                style={{
                  color: "var(--color-text-primary)",
                  marginTop: "4px",
                  marginBottom: "8px",
                  lineHeight: "1.3",
                }}
              >
                {ticket.subject}
              </h1>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Opened on {formatDateTime(ticket.createdAt)}
                {ticket.orderId && (
                  <>
                    {" · "}
                    <Link
                      href={`/orders/${ticket.orderId}`}
                      style={{ color: "var(--color-accent)", textDecoration: "underline" }}
                    >
                      Related Order #{ticket.orderId.slice(0, 8)}
                    </Link>
                  </>
                )}
              </p>
            </div>

            <span
              className="status-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontSize: "13px",
                fontWeight: "500",
                padding: "6px 12px",
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
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "8px",
              }}
            >
              Description
            </h3>
            {ticket.description ? (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "var(--color-bg)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  whiteSpace: "pre-wrap",
                  fontSize: "15px",
                  color: "var(--color-text-primary)",
                  lineHeight: "1.6",
                }}
              >
                {ticket.description}
              </div>
            ) : (
              <p style={{ fontStyle: "italic", color: "var(--color-text-secondary)", fontSize: "14px" }}>
                No description provided.
              </p>
            )}
          </div>
        </section>

        {/* Message Thread Section */}
        <section>
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--color-text-primary)", marginBottom: "20px" }}
          >
            Conversation Thread
          </h2>

          <div
            className="message-thread"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              padding: "24px",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            {ticket.messages.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--color-text-secondary)",
                  padding: "20px 0",
                  fontSize: "14px",
                  fontStyle: "italic",
                }}
              >
                No messages yet. Send a message to start the conversation.
              </div>
            ) : (
              ticket.messages.map((msg) => {
                const isCustomer = msg.authorId === user.id;

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isCustomer ? "flex-end" : "flex-start",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "14px 18px",
                        borderRadius: isCustomer
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                        backgroundColor: isCustomer
                          ? "rgba(214, 169, 67, 0.08)"
                          : "var(--color-bg)",
                        border: isCustomer
                          ? "1px solid var(--color-accent)"
                          : "1px solid var(--color-border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "24px",
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                          marginBottom: "6px",
                          fontWeight: "500",
                        }}
                      >
                        <span>{isCustomer ? "You" : "Support Agent"}</span>
                        <span>{formatDateTime(msg.createdAt)}</span>
                      </div>
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          fontSize: "14px",
                          color: "var(--color-text-primary)",
                          lineHeight: "1.5",
                        }}
                      >
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
