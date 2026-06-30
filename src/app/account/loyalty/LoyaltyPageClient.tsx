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

        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
            `Shop premium fashion on GVSwift! Sign up using my referral link to get extra discount points: ${referralLink}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: "#25D366",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.2s",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            marginTop: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
            style={{ display: "inline-block", verticalAlign: "middle" }}
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.517 2.266 2.27 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.464L0 24zm6.069-4.838c1.699.988 3.415 1.508 5.883 1.51 5.34 0 9.69-4.344 9.693-9.676.002-2.585-1.002-5.016-2.827-6.84C17.04 2.33 14.619 1.323 12.01 1.322c-5.347 0-9.697 4.345-9.7 9.68-.001 2.502.656 4.417 1.706 6.012l-.993 3.627 3.733-.979zm11.233-5.267c-.312-.156-1.848-.91-2.127-1.012-.278-.102-.482-.152-.684.152-.202.304-.78.983-.956 1.185-.175.203-.35.228-.662.073-.312-.156-1.316-.485-2.507-1.547-.927-.827-1.552-1.849-1.734-2.16-.182-.313-.02-.482.136-.637.14-.139.312-.363.468-.545.156-.182.208-.313.312-.52.104-.208.052-.389-.026-.545-.078-.156-.684-1.649-.938-2.259-.247-.595-.499-.514-.684-.523-.176-.009-.379-.01-.582-.01-.203 0-.532.076-.81.38-.278.304-1.063 1.039-1.063 2.533 0 1.493 1.088 2.934 1.24 3.137.152.203 2.142 3.272 5.19 4.587.725.313 1.291.5 1.734.64.729.232 1.392.2 1.916.122.584-.087 1.848-.757 2.11-.1.261.261.656.304.757.203.101.312.052.417-.026.573-.078.156-.684.91-1.011 1.216z" />
          </svg>
          Share on WhatsApp
        </a>

        <div
          style={{
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "4px",
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
