"use client";

import React, { useState } from "react";

interface LoyaltySettings {
  id: string;
  pointsPerRupee: number;
  rupeesPer100Points: number;
  referralBonus: number;
}

interface TopUser {
  userId: string;
  name: string | null;
  email: string;
  balance: number;
}

interface AdminLoyaltyClientProps {
  settings: LoyaltySettings;
  topUsers: TopUser[];
  total: number;
}

export default function AdminLoyaltyClient({
  settings: initialSettings,
  topUsers,
  total,
}: AdminLoyaltyClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [form, setForm] = useState({
    pointsPerRupee: String(initialSettings.pointsPerRupee),
    rupeesPer100Points: String(initialSettings.rupeesPer100Points),
    referralBonus: String(initialSettings.referralBonus),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/v1/admin/loyalty/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pointsPerRupee: parseInt(form.pointsPerRupee, 10),
          rupeesPer100Points: parseInt(form.rupeesPer100Points, 10),
          referralBonus: parseInt(form.referralBonus, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save settings");
        return;
      }
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    background: "var(--color-surface)",
    color: "var(--color-text-primary)",
    fontSize: "14px",
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Settings Form */}
      <section className="card p-6 flex flex-col gap-5">
        <h2 className="text-lg font-semibold text-primary">Points Configuration</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="flex flex-col gap-1">
            <label className="text-secondary" style={{ fontSize: "13px", fontWeight: 600 }}>
              Points per ₹1 spent
            </label>
            <input
              id="pointsPerRupee"
              type="number"
              min={0}
              style={inputStyle}
              value={form.pointsPerRupee}
              onChange={(e) => setForm((f) => ({ ...f, pointsPerRupee: e.target.value }))}
            />
            <p style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
              Earn {form.pointsPerRupee || "1"} pt(s) per rupee spent
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-secondary" style={{ fontSize: "13px", fontWeight: 600 }}>
              ₹ value of 100 points
            </label>
            <input
              id="rupeesPer100Points"
              type="number"
              min={0}
              style={inputStyle}
              value={form.rupeesPer100Points}
              onChange={(e) => setForm((f) => ({ ...f, rupeesPer100Points: e.target.value }))}
            />
            <p style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
              100 pts = ₹{form.rupeesPer100Points || "10"} off at checkout
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-secondary" style={{ fontSize: "13px", fontWeight: 600 }}>
              Referral bonus (points)
            </label>
            <input
              id="referralBonus"
              type="number"
              min={0}
              style={inputStyle}
              value={form.referralBonus}
              onChange={(e) => setForm((f) => ({ ...f, referralBonus: e.target.value }))}
            />
            <p style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
              Awarded to referrer when friend places first order
            </p>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: "13px", color: "var(--color-error)", fontWeight: 500 }}>{error}</div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            id="save-loyalty-settings"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ minWidth: "120px" }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Settings"}
          </button>
          {saved && (
            <span style={{ fontSize: "13px", color: "var(--color-success)", fontWeight: 500 }}>
              Settings updated successfully.
            </span>
          )}
        </div>
      </section>

      {/* Summary */}
      <section className="card p-6 flex flex-col gap-4">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="text-lg font-semibold text-primary">Top Members by Balance</h2>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            {total} member{total !== 1 ? "s" : ""} with loyalty accounts
          </span>
        </div>

        {topUsers.length === 0 ? (
          <p className="text-secondary text-sm">No loyalty accounts yet. Balances appear after the first order.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--color-text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--color-text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Email</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "var(--color-text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Balance (pts)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "var(--color-text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>≈ Value</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((u, i) => (
                  <tr key={u.userId} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "color-mix(in oklch, var(--color-primary) 2%, transparent)" }}>
                    <td style={{ padding: "10px 12px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                      {u.name ?? "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--color-text-secondary)", fontSize: "13px" }}>
                      {u.email}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "var(--color-accent)", fontFamily: "var(--font-heading)" }}>
                      {u.balance.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--color-success)", fontSize: "13px", fontWeight: 500 }}>
                      ≈ ₹{Math.floor((u.balance / 100) * settings.rupeesPer100Points).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
