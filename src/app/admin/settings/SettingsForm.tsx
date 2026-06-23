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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(errorMessage, "Save Failed");
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
    <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-5 admin-settings-container">
      <div>
        <h2 className="text-xl font-semibold mb-4 text-primary">System Configurations</h2>
        <p className="text-sm text-secondary">
          Tune operational properties and fraud thresholds. Changes take effect immediately.
        </p>
      </div>

      <div className="admin-divider" />

      <div className="flex flex-col gap-5">
        {/* COD Limit */}
        <div className="admin-settings-row">
          <div>
            <label className="admin-settings-label">COD Limit (₹)</label>
            <span className="admin-settings-help">
              Maximum total order amount allowed for Cash on Delivery. Recommended: ₹10,000.
            </span>
          </div>
          <div className="input-group margin-0">
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

        <div className="admin-divider-mute" />

        {/* Return Window */}
        <div className="admin-settings-row">
          <div>
            <label className="admin-settings-label">Return Window (Days)</label>
            <span className="admin-settings-help">
              Number of days post-delivery in which customers can request returns. Recommended: 7.
            </span>
          </div>
          <div className="input-group margin-0">
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

        <div className="admin-divider-mute" />

        {/* Cancellation Cutoff Status */}
        <div className="admin-settings-row">
          <div>
            <label className="admin-settings-label">Cancellation Cutoff Status</label>
            <span className="admin-settings-help">
              Orders at or beyond this status can no longer be cancelled by the customer. Recommended: SHIPPED.
            </span>
          </div>
          <div className="input-group margin-0">
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

        <div className="admin-divider-mute" />

        {/* Max Delivery Attempts */}
        <div className="admin-settings-row">
          <div>
            <label className="admin-settings-label">Max Delivery Attempts</label>
            <span className="admin-settings-help">
              Maximum failed deliveries allowed before the order automatically changes to RTO. Recommended: 2.
            </span>
          </div>
          <div className="input-group margin-0">
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

        <div className="admin-divider-mute" />

        {/* Watchlist Threshold */}
        <div className="admin-settings-row">
          <div>
            <label className="admin-settings-label">Failed Delivery Watchlist Threshold</label>
            <span className="admin-settings-help">
              Failures in 90 days before auto-flagging entity to MEDIUM and user to WATCHLIST. Recommended: 1.
            </span>
          </div>
          <div className="input-group margin-0">
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

        <div className="admin-divider-mute" />

        {/* High Risk Threshold */}
        <div className="admin-settings-row">
          <div>
            <label className="admin-settings-label">Failed Delivery High Risk Threshold</label>
            <span className="admin-settings-help">
              Failures in 90 days before auto-flagging entity to HIGH and user to HIGH_RISK. Recommended: 2.
            </span>
          </div>
          <div className="input-group margin-0">
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

        <div className="admin-divider-mute" />

        {/* Cancellation Risk Threshold */}
        <div className="admin-settings-row">
          <div>
            <label className="admin-settings-label">Cancellation Risk Threshold</label>
            <span className="admin-settings-help">
              Post-confirmation cancellations in 30 days before user is flagged for manual review. Recommended: 3.
            </span>
          </div>
          <div className="input-group margin-0">
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

      <div className="admin-divider mt-12" />

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={loading} className="btn-min-w-160">
          Save Settings
        </Button>
      </div>
    </form>
  );
}
