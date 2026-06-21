"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import type { SettingsMap } from "@/features/settings/types";

interface SettingsFormProps {
  initialSettings: SettingsMap;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [codLimitRupees, setCodLimitRupees] = useState<number>(
    initialSettings.cod_limit_paise / 100
  );
  const [returnWindowDays, setReturnWindowDays] = useState<number>(
    initialSettings.return_window_days
  );
  const [cancellationCutoffStatus, setCancellationCutoffStatus] = useState<string>(
    initialSettings.cancellation_cutoff_status
  );
  const [maxDeliveryAttempts, setMaxDeliveryAttempts] = useState<number>(
    initialSettings.max_delivery_attempts
  );
  const [failedDeliveryWatchlistThreshold, setFailedDeliveryWatchlistThreshold] = useState<number>(
    initialSettings.failed_delivery_watchlist_threshold
  );
  const [failedDeliveryHighRiskThreshold, setFailedDeliveryHighRiskThreshold] = useState<number>(
    initialSettings.failed_delivery_high_risk_threshold
  );
  const [cancellationRiskThreshold, setCancellationRiskThreshold] = useState<number>(
    initialSettings.cancellation_risk_threshold
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (codLimitRupees < 0 || !Number.isInteger(codLimitRupees)) {
        throw new Error("COD Limit must be a non-negative integer amount in Rupees");
      }
      if (returnWindowDays < 0 || !Number.isInteger(returnWindowDays)) {
        throw new Error("Return Window must be a non-negative number of days");
      }
      if (maxDeliveryAttempts < 1 || !Number.isInteger(maxDeliveryAttempts)) {
        throw new Error("Max Delivery Attempts must be at least 1");
      }
      if (failedDeliveryWatchlistThreshold < 1 || !Number.isInteger(failedDeliveryWatchlistThreshold)) {
        throw new Error("Watchlist threshold must be at least 1");
      }
      if (failedDeliveryHighRiskThreshold < 1 || !Number.isInteger(failedDeliveryHighRiskThreshold)) {
        throw new Error("High risk threshold must be at least 1");
      }
      if (cancellationRiskThreshold < 1 || !Number.isInteger(cancellationRiskThreshold)) {
        throw new Error("Cancellation risk threshold must be at least 1");
      }

      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            cod_limit_paise: codLimitRupees * 100,
            return_window_days: returnWindowDays,
            cancellation_cutoff_status: cancellationCutoffStatus,
            max_delivery_attempts: maxDeliveryAttempts,
            failed_delivery_watchlist_threshold: failedDeliveryWatchlistThreshold,
            failed_delivery_high_risk_threshold: failedDeliveryHighRiskThreshold,
            cancellation_risk_threshold: cancellationRiskThreshold,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      toast.success("System configurations updated successfully", "Settings Saved");
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred", "Save Failed");
    } finally {
      setLoading(false);
    }
  };

  const orderStatuses = [
    "PLACED",
    "CONFIRMED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "FAILED_DELIVERY",
    "RTO",
    "RETURN_REQUESTED",
    "RETURNED",
  ];

  return (
    <form onSubmit={handleSubmit} className="card p-6" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)", marginBottom: "4px" }}>System Configurations</h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
          Tune operational properties and fraud thresholds. Changes take effect immediately.
        </p>
      </div>

      <div style={{ borderBottom: "1px solid var(--color-border)" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* COD Limit */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          <div>
            <label className="font-medium" style={{ display: "block", marginBottom: "4px" }}>COD Limit (₹)</label>
            <span style={{ color: "var(--color-text-secondary)", fontSize: "12px", display: "block" }}>
              Maximum total order amount allowed for Cash on Delivery. Recommended: ₹10,000.
            </span>
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <input
              type="number"
              className="input-field"
              value={codLimitRupees}
              onChange={(e) => setCodLimitRupees(parseInt(e.target.value) || 0)}
              min="0"
              required
            />
          </div>
        </div>

        <div style={{ borderBottom: "1px solid var(--color-border)", opacity: 0.5 }} />

        {/* Return Window */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          <div>
            <label className="font-medium" style={{ display: "block", marginBottom: "4px" }}>Return Window (Days)</label>
            <span style={{ color: "var(--color-text-secondary)", fontSize: "12px", display: "block" }}>
              Number of days post-delivery in which customers can request returns. Recommended: 7.
            </span>
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <input
              type="number"
              className="input-field"
              value={returnWindowDays}
              onChange={(e) => setReturnWindowDays(parseInt(e.target.value) || 0)}
              min="0"
              required
            />
          </div>
        </div>

        <div style={{ borderBottom: "1px solid var(--color-border)", opacity: 0.5 }} />

        {/* Cancellation Cutoff Status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          <div>
            <label className="font-medium" style={{ display: "block", marginBottom: "4px" }}>Cancellation Cutoff Status</label>
            <span style={{ color: "var(--color-text-secondary)", fontSize: "12px", display: "block" }}>
              Orders at or beyond this status can no longer be cancelled by the customer. Recommended: SHIPPED.
            </span>
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <select
              className="input-field"
              value={cancellationCutoffStatus}
              onChange={(e) => setCancellationCutoffStatus(e.target.value)}
              required
            >
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ borderBottom: "1px solid var(--color-border)", opacity: 0.5 }} />

        {/* Max Delivery Attempts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          <div>
            <label className="font-medium" style={{ display: "block", marginBottom: "4px" }}>Max Delivery Attempts</label>
            <span style={{ color: "var(--color-text-secondary)", fontSize: "12px", display: "block" }}>
              Maximum failed deliveries allowed before the order automatically changes to RTO. Recommended: 2.
            </span>
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <input
              type="number"
              className="input-field"
              value={maxDeliveryAttempts}
              onChange={(e) => setMaxDeliveryAttempts(parseInt(e.target.value) || 0)}
              min="1"
              required
            />
          </div>
        </div>

        <div style={{ borderBottom: "1px solid var(--color-border)", opacity: 0.5 }} />

        {/* Watchlist Threshold */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          <div>
            <label className="font-medium" style={{ display: "block", marginBottom: "4px" }}>Failed Delivery Watchlist Threshold</label>
            <span style={{ color: "var(--color-text-secondary)", fontSize: "12px", display: "block" }}>
              Failures in 90 days before auto-flagging entity to MEDIUM and user to WATCHLIST. Recommended: 1.
            </span>
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <input
              type="number"
              className="input-field"
              value={failedDeliveryWatchlistThreshold}
              onChange={(e) => setFailedDeliveryWatchlistThreshold(parseInt(e.target.value) || 0)}
              min="1"
              required
            />
          </div>
        </div>

        <div style={{ borderBottom: "1px solid var(--color-border)", opacity: 0.5 }} />

        {/* High Risk Threshold */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          <div>
            <label className="font-medium" style={{ display: "block", marginBottom: "4px" }}>Failed Delivery High Risk Threshold</label>
            <span style={{ color: "var(--color-text-secondary)", fontSize: "12px", display: "block" }}>
              Failures in 90 days before auto-flagging entity to HIGH and user to HIGH_RISK. Recommended: 2.
            </span>
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <input
              type="number"
              className="input-field"
              value={failedDeliveryHighRiskThreshold}
              onChange={(e) => setFailedDeliveryHighRiskThreshold(parseInt(e.target.value) || 0)}
              min="1"
              required
            />
          </div>
        </div>

        <div style={{ borderBottom: "1px solid var(--color-border)", opacity: 0.5 }} />

        {/* Cancellation Risk Threshold */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          <div>
            <label className="font-medium" style={{ display: "block", marginBottom: "4px" }}>Cancellation Risk Threshold</label>
            <span style={{ color: "var(--color-text-secondary)", fontSize: "12px", display: "block" }}>
              Post-confirmation cancellations in 30 days before user is flagged for manual review. Recommended: 3.
            </span>
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <input
              type="number"
              className="input-field"
              value={cancellationRiskThreshold}
              onChange={(e) => setCancellationRiskThreshold(parseInt(e.target.value) || 0)}
              min="1"
              required
            />
          </div>
        </div>
      </div>

      <div style={{ borderBottom: "1px solid var(--color-border)", marginTop: "12px" }} />

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" variant="primary" loading={loading} style={{ minWidth: "160px" }}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}
