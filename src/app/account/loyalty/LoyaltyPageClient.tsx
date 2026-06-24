"use client";

import React, { useState } from "react";

interface LoyaltyPageClientProps {
  referralCode: string;
  referralLink: string;
  balance: number;
  rupeesPer100Points: number;
  ledger: Array<{
    id: string;
    delta: number;
    reason: string;
    orderId: string | null;
    createdAt: string;
  }>;
}

export default function LoyaltyPageClient({
  referralCode,
  referralLink,
  balance,
  rupeesPer100Points,
  ledger,
}: LoyaltyPageClientProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const discountValue = Math.floor((balance / 100) * rupeesPer100Points);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full px-4">
      {/* Balance Display */}
      <div
        className="rounded-xl p-6 text-center"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, color-mix(in oklch, var(--color-primary) 70%, #000) 100%)",
          color: "#fff",
        }}
      >
        <p style={{ fontSize: "13px", opacity: 0.8, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Your Points Balance
        </p>
        <p style={{ fontSize: "56px", fontWeight: 800, lineHeight: 1, fontFamily: "var(--font-heading)", margin: "8px 0", fontVariantNumeric: "tabular-nums" }}>
          {balance.toLocaleString("en-IN")}
        </p>
        <p style={{ fontSize: "14px", opacity: 0.85, marginTop: "6px" }}>
          pts
          {balance > 0 && (
            <span style={{ marginLeft: "12px", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
              ≈ ₹{discountValue} off at checkout
            </span>
          )}
        </p>
        <p style={{ fontSize: "12px", opacity: 0.65, marginTop: "6px" }}>
          Every 100 points = ₹{rupeesPer100Points} discount
        </p>
      </div>

      {/* Referral Link Card */}
      <div className="card p-5 flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-primary">Your Referral Link</h2>
        <p className="text-secondary text-sm">
          Share this link with friends. When they place their first order, you earn{" "}
          <strong style={{ color: "var(--color-accent)" }}>bonus points!</strong>
        </p>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
          <code
            style={{
              flex: 1,
              background: "color-mix(in oklch, var(--color-primary) 4%, var(--color-surface))",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 12px",
              fontSize: "13px",
              color: "var(--color-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {referralLink}
          </code>
          <button
            id="copy-referral-link"
            onClick={handleCopyLink}
            style={{
              backgroundColor: copied ? "var(--color-success)" : "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
              transition: "background-color 0.2s",
              minWidth: "80px",
            }}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>🔑</span>
          <span>Your referral code: <strong style={{ fontFamily: "monospace" }}>{referralCode}</strong></span>
        </div>
      </div>

      {/* Points History */}
      <div className="card p-5 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-primary">Points History</h2>

        {ledger.length === 0 ? (
          <p className="text-secondary text-sm">
            No points activity yet. Place an order to start earning!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {/* Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "8px",
                padding: "8px 12px",
                borderBottom: "1px solid var(--color-border)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-text-secondary)",
                fontWeight: 600,
              }}
            >
              <span>Activity</span>
              <span style={{ textAlign: "right" }}>Points</span>
            </div>

            {ledger.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "8px",
                  padding: "12px",
                  borderBottom: "1px solid var(--color-border)",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                    {entry.reason}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                    {formatDate(entry.createdAt)}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: entry.delta > 0 ? "var(--color-success)" : "var(--color-error)",
                    textAlign: "right",
                    fontFamily: "var(--font-heading)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {entry.delta > 0 ? "+" : ""}{entry.delta.toLocaleString("en-IN")} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
