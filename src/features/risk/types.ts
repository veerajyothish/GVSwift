/**
 * features/risk/types.ts — Risk domain types
 *
 * Types for RiskFlag CRUD and lookup operations.
 */

import { RiskFlag, RiskEntityType, RiskLevel } from "@prisma/client";

export type { RiskFlag };
export { RiskEntityType, RiskLevel };

/* ── Lookup result types ──────────────────────────────────────────────── */

/**
 * Describes the checkout / serviceability behavior for a given entity.
 *
 * The behavior table (Database Design Document §2.2, Operations §2):
 *
 * | riskLevel | codAllowed | requiresApproval | serviceable | description                         |
 * |-----------|-----------|------------------|-------------|-------------------------------------|
 * | (no row)  | false     | false            | false       | Not serviceable                     |
 * | LOW       | true      | false            | true        | Normal — COD allowed, no friction   |
 * | MEDIUM    | true      | false            | true        | Watchlisted — COD allowed, logged   |
 * | HIGH      | true      | true             | true        | Admin approval before CONFIRMED     |
 * | BLOCKED   | false     | false            | true        | COD specifically disabled           |
 */
export interface RiskLookupResult {
  /** Whether a RiskFlag row exists for this entity */
  found: boolean;
  /** The risk level, or null if no row exists */
  riskLevel: RiskLevel | null;
  /** Whether the entity is serviceable (pincode in delivery zone) */
  serviceable: boolean;
  /** Whether COD is allowed for this entity */
  codAllowed: boolean;
  /** Whether the order requires manual admin approval before CONFIRMED */
  requiresApproval: boolean;
  /** Human-readable description of the behavior */
  description: string;
}

/* ── CRUD param types ─────────────────────────────────────────────────── */

export interface CreateRiskFlagParams {
  entityType: RiskEntityType;
  entityValue: string;
  riskLevel: RiskLevel;
}

export interface UpdateRiskFlagParams {
  riskLevel: RiskLevel;
}

export interface ListRiskFlagsParams {
  entityType?: RiskEntityType;
  entityValue?: string;
  riskLevel?: RiskLevel;
  page?: number;
  limit?: number;
}

export interface PaginatedRiskFlagsResult {
  flags: RiskFlag[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
