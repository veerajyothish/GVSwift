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
    <div className="flex flex-col gap-5">
      {/* Header and Back navigation */}
      <div>
        <Link
          href="/admin/complaints"
          className="text-accent text-sm font-medium mb-12 flex items-center gap-2"
        >
          &larr; Back to Complaints
        </Link>
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {ticket.subject}
            </h1>
            <p className="text-secondary text-sm mt-2">
              Ticket ID: {ticket.id}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span
              className="status-badge"
              style={{
                ...ticketBadge,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {ticket.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* Main conversation section */}
        <div className="flex flex-col gap-5">
          {/* Ticket Description Card */}
          <div className="card p-5">
            <h3 className="text-15 font-semibold text-primary mb-8">
              Original Description
            </h3>
            <div
              className="text-primary text-sm rounded-md p-3"
              style={{
                whiteSpace: "pre-wrap",
                backgroundColor: "rgba(86, 25, 34, 0.04)",
                border: "1px solid var(--color-border)",
              }}
            >
              {ticket.description || <span className="text-secondary">No description provided.</span>}
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-primary pb-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
              Message History
            </h2>

            {ticket.messages.length === 0 ? (
              <div className="p-5 text-center text-secondary text-sm">
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
                      backgroundColor: "rgba(86, 25, 34, 0.06)",
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
                        border: "1px solid rgba(86, 25, 34, 0.25)",
                      },
                      headerLabel: "Admin Reply",
                      headerColor: "var(--color-accent)",
                    };

                return (
                  <div key={msg.id} style={cardStyle}>
                    <div className="flex justify-between text-xs pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <span className="font-semibold" style={{ color: headerColor }}>
                        {headerLabel}
                      </span>
                      <span className="text-secondary">
                        {new Date(msg.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-primary" style={{ whiteSpace: "pre-wrap" }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply Form */}
          <div className="card p-5">
            {/* Reply Type Toggle tabs */}
            <div className="flex mb-16 gap-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
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

            <form onSubmit={handleSendReply} className="flex flex-col gap-4">
              <div className="input-group margin-0">
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
                <div className="text-error text-sm font-medium">
                  {replyError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="btn btn-primary"
                  style={{
                    minWidth: "160px",
                    backgroundColor: isInternal ? "var(--color-text-secondary)" : "var(--color-accent)", // visual distinction for internal note
                    borderColor: isInternal ? "var(--color-text-secondary)" : "var(--color-accent)",
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
        <div className="flex flex-col gap-5">
          {/* Metadata Card */}
          <div className="card p-5 flex flex-col gap-4">
            <h3 className="font-semibold text-accent text-base margin-0 pb-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
              Ticket Details
            </h3>

            {/* Status Control */}
            <div className="flex flex-col gap-2">
              <label className="text-secondary text-13 font-medium">
                Update Status
              </label>
              <select
                className="input-field"
                value={statusVal}
                onChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              {statusError && (
                <span className="text-error text-xs">{statusError}</span>
              )}
            </div>

            {/* Customer Details */}
            <div className="flex flex-col gap-1">
              <span className="text-secondary text-13">Customer Email</span>
              <span className="text-primary text-sm font-medium" style={{ wordBreak: "break-all" }}>
                {ticket.user?.email || "Guest"}
              </span>
            </div>

            {ticket.user?.phone && (
              <div className="flex flex-col gap-1">
                <span className="text-secondary text-13">Customer Phone</span>
                <span className="text-primary text-sm font-medium">
                  {ticket.user.phone}
                </span>
              </div>
            )}

            {/* Order Association */}
            <div className="flex flex-col gap-1">
              <span className="text-secondary text-13">Linked Order</span>
              {ticket.orderId ? (
                <Link
                  href={`/admin/orders/${ticket.orderId}`}
                  className="text-accent text-sm font-semibold underline"
                >
                  View Associated Order
                </Link>
              ) : (
                <span className="text-secondary text-sm">None</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-secondary text-13">Created At</span>
              <span className="text-primary text-sm font-medium">
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
