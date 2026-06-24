/**
 * features/settings/service.ts — Typed Settings service
 *
 * TICKET-601: Single source of truth for all business-rule reads.
 * Other features (checkout, orders, risk triggers) call the typed
 * getters here — they MUST NOT hardcode values or read the Setting
 * table directly.
 *
 * Implementation:
 *   - get<Key>(): reads the Setting row by key, JSON.parse's the value,
 *     and returns it with the correct TypeScript type.
 *   - If the row doesn't exist, falls back to SETTINGS_DEFAULTS.
 *   - set<Key>(): validates the value and writes/updates the Setting row.
 *   - getAllSettings(): returns all settings as a typed object.
 *
 * Values take effect immediately on the next request without redeploy.
 *
 * @see docs/06-Operations-Support.md §2
 */

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { SettingKey, SettingsMap } from "./types";
import { SETTINGS_DEFAULTS, SETTINGS_META } from "./types";

/* ── Generic low-level get / set ──────────────────────────────────────── */

/**
 * Reads a single setting by key with type safety.
 * Falls back to SETTINGS_DEFAULTS if no DB row exists.
 */
export async function getSetting<K extends SettingKey>(
  key: K
): Promise<SettingsMap[K]> {
  const row = await prisma.setting.findUnique({ where: { key } });

  if (!row) {
    // No DB row yet — return compile-time default
    return SETTINGS_DEFAULTS[key];
  }

  try {
    return JSON.parse(row.value) as SettingsMap[K];
  } catch {
    // Corrupted value — log and fall back
    console.error(
      `[Settings] Failed to parse value for key "${key}":`,
      row.value
    );
    return SETTINGS_DEFAULTS[key];
  }
}

/**
 * Writes a single setting by key. Creates the row if it doesn't exist,
 * updates it if it does.
 */
export async function setSetting<K extends SettingKey>(
  key: K,
  value: SettingsMap[K]
): Promise<void> {
  const serialized = JSON.stringify(value);

  await prisma.setting.upsert({
    where: { key },
    update: { value: serialized },
    create: { key, value: serialized },
  });
}

/**
 * Returns all settings as a fully-typed object.
 * Any missing DB rows are filled from SETTINGS_DEFAULTS.
 */
export async function getAllSettings(): Promise<SettingsMap> {
  const rows = await prisma.setting.findMany();
  const dbMap = new Map(rows.map((r) => [r.key, r.value]));

  const result = { ...SETTINGS_DEFAULTS };

  for (const key of Object.keys(SETTINGS_DEFAULTS) as SettingKey[]) {
    const raw = dbMap.get(key);
    if (raw !== undefined) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any)[key] = JSON.parse(raw);
      } catch {
        console.error(`[Settings] Failed to parse "${key}":`, raw);
        // keep default
      }
    }
  }

  return result;
}

/* ── Typed convenience getters ────────────────────────────────────────── */
// These are the public API — consumers call these, not getSetting() directly.
// Each getter's name makes usage self-documenting in calling code:
//   const limit = await getCodLimitPaise();    ← clear
//   const limit = await getSetting("cod_limit_paise"); ← unclear

/** Maximum COD order value in paise. Default: ₹10,000 (1,000,000 paise) */
export async function getCodLimitPaise(): Promise<number> {
  return getSetting("cod_limit_paise");
}

/** Number of days after delivery for returns. Default: 7 */
export async function getReturnWindowDays(): Promise<number> {
  return getSetting("return_window_days");
}

/** OrderStatus at/beyond which customer cannot cancel. Default: SHIPPED */
export async function getCancellationCutoffStatus(): Promise<string> {
  return getSetting("cancellation_cutoff_status");
}

/** Delivery attempts before auto-RTO. Default: 2 */
export async function getMaxDeliveryAttempts(): Promise<number> {
  return getSetting("max_delivery_attempts");
}

/** Failed deliveries in 90 days before MEDIUM/WATCHLIST. Default: 1 */
export async function getFailedDeliveryWatchlistThreshold(): Promise<number> {
  return getSetting("failed_delivery_watchlist_threshold");
}

/** Failed deliveries in 90 days before HIGH/HIGH_RISK. Default: 2 */
export async function getFailedDeliveryHighRiskThreshold(): Promise<number> {
  return getSetting("failed_delivery_high_risk_threshold");
}

/** Post-CONFIRMED cancellations in 30 days before flagging. Default: 3 */
export async function getCancellationRiskThreshold(): Promise<number> {
  return getSetting("cancellation_risk_threshold");
}

/** Stock quantity below which a product variant is flagged as low stock. Default: 10 */
export async function getLowStockThreshold(): Promise<number> {
  return getSetting("low_stock_threshold");
}

/* ── Validated setter (used by admin settings UI — TICKET-602) ────────── */

/**
 * Updates a setting with validation. Used by the admin settings page.
 * Validates the key exists and the value is of the correct type.
 */
export async function updateSetting(key: string, value: unknown): Promise<void> {
  // Validate key is a known setting
  if (!(key in SETTINGS_DEFAULTS)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Unknown setting key: "${key}"`,
      400
    );
  }

  const typedKey = key as SettingKey;
  const meta = SETTINGS_META.find((m) => m.key === typedKey);

  // Type-specific validation
  if (meta) {
    switch (meta.type) {
      case "paise":
      case "number": {
        const num = Number(value);
        if (!Number.isFinite(num) || !Number.isInteger(num)) {
          throw new AppError(
            "VALIDATION_ERROR",
            `"${key}" must be an integer`,
            400
          );
        }
        if (num < 0) {
          throw new AppError(
            "VALIDATION_ERROR",
            `"${key}" cannot be negative`,
            400
          );
        }
        await setSetting(typedKey, num as SettingsMap[typeof typedKey]);
        return;
      }
      case "order_status": {
        const validStatuses = [
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
        if (typeof value !== "string" || !validStatuses.includes(value)) {
          throw new AppError(
            "VALIDATION_ERROR",
            `"${key}" must be a valid OrderStatus`,
            400
          );
        }
        await setSetting(typedKey, value as SettingsMap[typeof typedKey]);
        return;
      }
    }
  }

  // Fallback: accept as-is (shouldn't hit this with proper SETTINGS_META)
  await setSetting(typedKey, value as SettingsMap[typeof typedKey]);
}

/* ── Re-exports for convenience ───────────────────────────────────────── */

export { SETTINGS_DEFAULTS, SETTINGS_META } from "./types";
export type { SettingKey, SettingsMap, SettingMeta } from "./types";
