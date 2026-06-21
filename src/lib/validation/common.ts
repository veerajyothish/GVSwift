/**
 * lib/validation/common.ts — Shared Zod primitives
 *
 * Re-used across features to enforce consistent validation rules for
 * common Indian e-commerce data types.
 *
 * Import these into feature-level validation schemas (e.g.,
 * features/catalog/validation.ts) rather than duplicating regexes.
 */

import { z } from "zod";

/** Indian 6-digit pincode */
export const pincodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Pincode must be exactly 6 digits");

/** Indian mobile number — 10 digits, starting with 6-9 */
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

/**
 * Money value in paise (integer). Rejects decimals and negatives.
 * All price/total fields in the schema use paise.
 */
export const paiseSchema = z
  .number()
  .int("Amount must be a whole number of paise")
  .nonnegative("Amount cannot be negative");

/** Non-empty trimmed string with max length */
export function textField(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(maxLength, `${label} must be at most ${maxLength} characters`);
}

/** Slug — lowercase letters, digits, hyphens */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase-hyphenated");
