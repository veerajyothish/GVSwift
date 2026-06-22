"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TicketStatus, SupportTicket, TicketMessage } from "@prisma/client";

interface UserInfo {
  id: string;
  email: string;
  phone: string | null;
}

interface OrderInfo {
  id: string;
}

interface TicketDetail extends SupportTicket {
  user: UserInfo | null;
  order: OrderInfo | null;
  messages: TicketMessage[];
}

interface ComplaintDetailManagerProps {
  initialTicket: TicketDetail;
}

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

export default function ComplaintDetailManager({ initialTicket }: ComplaintDetailManagerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [ticket, setTicket] = useState<TicketDetail>(initialTicket);
  const [statusVal, setStatusVal] = useState<TicketStatus>(initialTicket.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState("");

  // Sync state if initialTicket changes (e.g. from router.refresh)
  React.useEffect(() => {
    setTicket(initialTicket);
    setStatusVal(initialTicket.status);
  }, [initialTicket]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as TicketStatus;
    setStatusVal(nextStatus);
    setUpdatingStatus(true);
    setStatusError("");

    try {
      const res = await fetch(`/api/v1/admin/complaints/${ticket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      const error = err as Error;
      setStatusError(error.message || "An error occurred while updating status");
      // Revert select input to current ticket status
      setStatusVal(ticket.status);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text) return;

    setSendingReply(true);
    setReplyError("");

    try {
      const res = await fetch(`/api/v1/admin/complaints/${ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, isInternal }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit message");
      }

      setReplyText("");
      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      const error = err as Error;
      setReplyError(error.message || "An error occurred while sending message");
    } finally {
      setSendingReply(false);
    }
  };

  const ticketBadge = getStatusBadgeStyle(ticket.status);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header and Back navigation */}
      <div>
        <Link
          href="/admin/complaints"
          style={{
            fontSize: "14px",
            color: "var(--color-accent)",
            fontWeight: 500,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "12px",
          }}
        >
          &larr; Back to Complaints
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              {ticket.subject}
            </h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>
              Ticket ID: {ticket.id}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontWeight: 600,
                textTransform: "uppercase",
                border: "1px solid",
                ...ticketBadge,
              }}
            >
              {ticket.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }}>
        {/* Main conversation section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Ticket Description Card */}
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
            }}
          >
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>
              Original Description
            </h3>
            <div
              style={{
                color: "var(--color-text-primary)",
                fontSize: "14px",
                whiteSpace: "pre-wrap",
                backgroundColor: "rgba(0,0,0,0.15)",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
              }}
            >
              {ticket.description || <span style={{ color: "var(--color-text-secondary)" }}>No description provided.</span>}
            </div>
          </div>

          {/* Conversation Thread */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
              Message History
            </h2>

            {ticket.messages.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "14px" }}>
                No messages in this thread yet.
              </div>
            ) : (
              ticket.messages.map((msg) => {
                const isCustomer = msg.authorId === ticket.userId;
                const isInternalNote = msg.isInternal;

                const baseCardStyle: React.CSSProperties = {
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                };
                const {
                  cardStyle,
                  headerLabel,
                  headerColor,
                }: {
                  cardStyle: React.CSSProperties;
                  headerLabel: string;
                  headerColor: string;
                } = isInternalNote
                  ? {
                    cardStyle: {
                      ...baseCardStyle,
                      backgroundColor: "rgba(212, 169, 67, 0.08)",
                      border: "1px solid var(--color-accent)",
                    },
                    headerLabel: "Internal Note",
                    headerColor: "var(--color-accent)",
                  }
                  : isCustomer
                    ? {
                      cardStyle: {
                        ...baseCardStyle,
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      },
                      headerLabel: `Customer (${ticket.user?.email || "Guest"})`,
                      headerColor: "var(--color-text-primary)",
                    }
                    : {
                      cardStyle: {
                        ...baseCardStyle,
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid rgba(212, 169, 67, 0.3)",
                      },
                      headerLabel: "Admin Reply",
                      headerColor: "var(--color-accent)",
                    };

                return (
                  <div key={msg.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                      <span style={{ fontWeight: 600, color: headerColor }}>
                        {headerLabel}
                      </span>
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        {new Date(msg.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply Form */}
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
            }}
          >
            {/* Reply Type Toggle tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "16px", gap: "16px" }}>
              <button
                type="button"
                onClick={() => setIsInternal(false)}
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: !isInternal ? "2px solid var(--color-accent)" : "2px solid transparent",
                  color: !isInternal ? "var(--color-accent)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Reply to Customer
              </button>
              <button
                type="button"
                onClick={() => setIsInternal(true)}
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: isInternal ? "2px solid var(--color-accent)" : "2px solid transparent",
                  color: isInternal ? "var(--color-accent)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Add Internal Note
              </button>
            </div>

            <form onSubmit={handleSendReply} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="input-group" style={{ margin: 0 }}>
                <textarea
                  className="input-field"
                  placeholder={isInternal ? "Write a private note only visible to admin staff..." : "Write a message that will be visible to the customer..."}
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ minHeight: "120px" }}
                />
              </div>

              {replyError && (
                <div style={{ color: "var(--color-error)", fontSize: "14px", fontWeight: 500 }}>
                  {replyError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="btn btn-primary"
                  style={{
                    minWidth: "160px",
                    backgroundColor: isInternal ? "#d49843" : "var(--color-accent)", // visually differentiate internal note action button
                    borderColor: isInternal ? "#d49843" : "var(--color-accent)",
                    color: "var(--color-accent-text)",
                  }}
                >
                  {sendingReply ? "Sending..." : isInternal ? "Add Internal Note" : "Send Reply"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Info Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Metadata Card */}
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-accent)", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px", margin: 0 }}>
              Ticket Details
            </h3>

            {/* Status Control */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                Update Status
              </label>
              <select
                className="input-field"
                value={statusVal}
                onChange={handleStatusChange}
                disabled={updatingStatus}
                style={{ padding: "8px 12px" }}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              {statusError && (
                <span style={{ fontSize: "12px", color: "var(--color-error)" }}>{statusError}</span>
              )}
            </div>

            {/* Customer Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Customer Email</span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", wordBreak: "break-all" }}>
                {ticket.user?.email || "Guest"}
              </span>
            </div>

            {ticket.user?.phone && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Customer Phone</span>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>
                  {ticket.user.phone}
                </span>
              </div>
            )}

            {/* Order Association */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Linked Order</span>
              {ticket.orderId ? (
                <Link
                  href={`/admin/orders/${ticket.orderId}`}
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-accent)",
                    textDecoration: "underline",
                  }}
                >
                  View Associated Order
                </Link>
              ) : (
                <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>None</span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Created At</span>
              <span style={{ fontSize: "14px", color: "var(--color-text-primary)" }}>
                {new Date(ticket.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
