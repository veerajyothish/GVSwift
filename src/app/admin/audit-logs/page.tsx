import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  // Fetch last 100 audit logs, including actor details
  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  const getBadgeColor = (action: string) => {
    if (action.includes("DELETE")) return { bg: "var(--color-error)", text: "#fff" };
    if (action.includes("CREATE")) return { bg: "var(--color-success)", text: "#fff" };
    if (action.includes("UPDATE")) return { bg: "var(--color-accent)", text: "#fff" };
    if (action.includes("STATUS_CHANGE")) return { bg: "var(--color-warning)", text: "#fff" };
    return { bg: "var(--color-surface-offset)", text: "var(--color-text-primary)" };
  };

  const parseDetails = (detailsStr: string | null) => {
    if (!detailsStr) return "-";
    try {
      const obj = JSON.parse(detailsStr);
      // Remove generic wrapper items if present to save table space
      const cleaned = { ...obj };
      delete cleaned.targetType;
      delete cleaned.targetId;
      
      const keys = Object.keys(cleaned);
      if (keys.length === 0) return "-";

      return (
        <div style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--color-text-secondary)" }}>
          {keys.map((k) => (
            <div key={k} style={{ marginBottom: "2px" }}>
              <strong>{k}:</strong> {typeof cleaned[k] === "object" ? JSON.stringify(cleaned[k]) : String(cleaned[k])}
            </div>
          ))}
        </div>
      );
    } catch {
      return detailsStr;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: 400,
              color: "var(--color-text-primary)",
              marginBottom: "6px",
            }}
          >
            Audit Logs
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
            A detailed history of actions performed by administrators.
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "rgba(0,0,0,0.01)" }}>
                <th style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Timestamp</th>
                <th style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Administrator</th>
                <th style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Action</th>
                <th style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Order Reference</th>
                <th style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "14px" }}>
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const colors = getBadgeColor(log.action);
                  return (
                    <tr
                      key={log.id}
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                      className="hover-lift"
                    >
                      {/* Timestamp */}
                      <td
                        style={{
                          padding: "16px 20px",
                          fontSize: "13px",
                          fontVariantNumeric: "tabular-nums",
                          color: "var(--color-text-primary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>

                      {/* Administrator */}
                      <td style={{ padding: "16px 20px", fontSize: "13px" }}>
                        <div style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                          {log.actor?.name || "System"}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                          {log.actor?.email || "automated-process"}
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td style={{ padding: "16px 20px", fontSize: "13px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            letterSpacing: "0.02em",
                            backgroundColor: colors.bg,
                            color: colors.text,
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Order Reference */}
                      <td style={{ padding: "16px 20px", fontSize: "13px" }}>
                        {log.orderId ? (
                          <Link
                            href={`/admin/orders/${log.orderId}`}
                            style={{
                              color: "var(--color-accent)",
                              textDecoration: "underline",
                              fontWeight: 500,
                            }}
                          >
                            Order #{log.orderId.slice(-8).toUpperCase()}
                          </Link>
                        ) : (
                          <span style={{ color: "var(--color-text-secondary)" }}>-</span>
                        )}
                      </td>

                      {/* Details JSON */}
                      <td style={{ padding: "16px 20px", fontSize: "13px" }}>
                        {parseDetails(log.details)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
