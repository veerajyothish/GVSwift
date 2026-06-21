/**
 * features/settings/types.ts — Typed settings keys and their value types
 *
 * This is the single source of truth for all business-rule settings.
 * Other features (checkout, orders, risk) import these typed keys —
 * no hardcoded constants allowed anywhere else in the codebase.
 *
 * @see docs/06-Operations-Support.md §2
 */

import { OrderStatus } from "@prisma/client";

/* ── Setting key registry ─────────────────────────────────────────────── */

/**
 * Exhaustive map of every setting key → its parsed TypeScript type.
 * Adding a new setting means: add a key here, add a default in DEFAULTS,
 * and add a typed getter in the service.
 */
export interface SettingsMap {
  /** Maximum COD order value in paise. ₹10,000 = 1_000_000 paise */
  cod_limit_paise: number;

  /** Number of days after delivery within which a return can be requested */
  return_window_days: number;

  /** The OrderStatus at or beyond which a customer can no longer cancel */
  cancellation_cutoff_status: OrderStatus;

  /** Number of delivery attempts before automatic RTO */
  max_delivery_attempts: number;

  /**
   * Number of failed deliveries in a 90-day window that triggers
   * auto-flagging the entity to MEDIUM / user to WATCHLIST.
   */
  failed_delivery_watchlist_threshold: number;

  /**
   * Number of failed deliveries in a 90-day window that escalates
   * the entity to HIGH / user to HIGH_RISK.
   */
  failed_delivery_high_risk_threshold: number;

  /**
   * Number of post-CONFIRMED cancellations in a 30-day window
   * that flags the user/entity for manual review.
   */
  cancellation_risk_threshold: number;
}

/** All valid setting keys */
export type SettingKey = keyof SettingsMap;

/* ── Defaults ─────────────────────────────────────────────────────────── */

/**
 * Default values for every setting, matching Operations §2.
 * These are used as fallbacks when a key has no row in the DB
 * (e.g. before the seed script runs, or if a new key is added
 * after the initial seed).
 *
 * ⚠️  Keep these in sync with prisma/seed.ts.
 */
export const SETTINGS_DEFAULTS: Readonly<SettingsMap> = {
  cod_limit_paise: 1_000_000,                      // ₹10,000
  return_window_days: 7,
  cancellation_cutoff_status: "SHIPPED" as OrderStatus,
  max_delivery_attempts: 2,                         // Operations §2: balanced default
  failed_delivery_watchlist_threshold: 1,            // 1 failure in 90 days → MEDIUM/WATCHLIST
  failed_delivery_high_risk_threshold: 2,            // 2 failures in 90 days → HIGH/HIGH_RISK
  cancellation_risk_threshold: 3,                    // 3 post-CONFIRMED cancellations in 30 days
};

/* ── Metadata for admin UI (TICKET-602) ───────────────────────────────── */

export interface SettingMeta {
  key: SettingKey;
  label: string;
  description: string;
  type: "paise" | "number" | "order_status";
}

export const SETTINGS_META: readonly SettingMeta[] = [
  {
    key: "cod_limit_paise",
    label: "COD Limit",
    description: "Maximum COD order value in paise (₹10,000 = 1,000,000 paise)",
    type: "paise",
  },
  {
    key: "return_window_days",
    label: "Return Window (Days)",
    description: "Number of days after delivery within which a return can be requested",
    type: "number",
  },
  {
    key: "cancellation_cutoff_status",
    label: "Cancellation Cutoff Status",
    description: "The OrderStatus at or beyond which a customer can no longer cancel",
    type: "order_status",
  },
  {
    key: "max_delivery_attempts",
    label: "Max Delivery Attempts",
    description: "Number of delivery attempts before automatic RTO",
    type: "number",
  },
  {
    key: "failed_delivery_watchlist_threshold",
    label: "Failed Delivery → Watchlist Threshold",
    description: "Failed deliveries in 90 days before auto-flagging MEDIUM/WATCHLIST",
    type: "number",
  },
  {
    key: "failed_delivery_high_risk_threshold",
    label: "Failed Delivery → High Risk Threshold",
    description: "Failed deliveries in 90 days before escalating to HIGH/HIGH_RISK",
    type: "number",
  },
  {
    key: "cancellation_risk_threshold",
    label: "Cancellation Risk Threshold",
    description: "Post-CONFIRMED cancellations in 30 days before flagging for review",
    type: "number",
  },
] as const;
