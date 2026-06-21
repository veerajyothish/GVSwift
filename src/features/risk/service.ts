/**
 * features/risk/service.ts — Risk flag CRUD + lookup service
 *
 * TICKET-501: Implements create/update risk flags by entity type
 * (PHONE/ADDRESS/PINCODE/USER) and a lookup function used by both
 * address entry (serviceability) and checkout (COD eligibility).
 *
 * Behavior table (Database Design Document §2.2, Operations §2):
 *
 * | riskLevel on PINCODE flag | Checkout behavior                              |
 * |--------------------------|------------------------------------------------|
 * | (no row exists)          | Not serviceable — reject at address entry       |
 * | LOW                      | Serviceable, COD allowed, no friction            |
 * | MEDIUM                   | Serviceable, COD allowed, watchlisted/logged     |
 * | HIGH                     | Serviceable, COD allowed, admin approval needed  |
 * | BLOCKED                  | Serviceable, but COD disabled for this entity    |
 *
 * The same lookup logic applies to non-PINCODE entity types (PHONE,
 * ADDRESS, USER), except that "not serviceable" only applies to PINCODE
 * lookups. For other entity types, absence of a row means "no flag" (normal).
 *
 * @see docs/05-Database-Design.md §2.2
 * @see docs/06-Operations-Support.md §2
 */

import { AppError } from "@/lib/errors";
import * as repository from "./repository";
import {
  CreateRiskFlagSchema,
  UpdateRiskFlagSchema,
  LookupRiskFlagSchema,
  ListRiskFlagsSchema,
} from "./validation";
import type { RiskLookupResult, PaginatedRiskFlagsResult } from "./types";
import { RiskEntityType, RiskLevel } from "@prisma/client";

/* ── Behavior mapping ─────────────────────────────────────────────────── */

/**
 * Maps a RiskLevel to its checkout/serviceability behavior.
 * This is the single source of truth for the behavior table.
 */
function resolveBehavior(
  riskLevel: RiskLevel | null,
  entityType: RiskEntityType
): RiskLookupResult {
  // No row exists
  if (riskLevel === null) {
    // For PINCODE: absence means "not serviceable"
    if (entityType === RiskEntityType.PINCODE) {
      return {
        found: false,
        riskLevel: null,
        serviceable: false,
        codAllowed: false,
        requiresApproval: false,
        description: "We don't currently ship to this pincode.",
      };
    }

    // For other entity types: absence means "no flag, normal"
    return {
      found: false,
      riskLevel: null,
      serviceable: true,
      codAllowed: true,
      requiresApproval: false,
      description: "No risk flag — normal operations.",
    };
  }

  // Row exists — resolve by level
  switch (riskLevel) {
    case RiskLevel.LOW:
      return {
        found: true,
        riskLevel,
        serviceable: true,
        codAllowed: true,
        requiresApproval: false,
        description: "Serviceable, COD allowed with no extra friction.",
      };

    case RiskLevel.MEDIUM:
      return {
        found: true,
        riskLevel,
        serviceable: true,
        codAllowed: true,
        requiresApproval: false,
        description:
          "Serviceable, COD allowed. Order is logged/watchlisted for review patterns.",
      };

    case RiskLevel.HIGH:
      return {
        found: true,
        riskLevel,
        serviceable: true,
        codAllowed: true,
        requiresApproval: true,
        description:
          "Serviceable, but order requires manual admin approval before CONFIRMED.",
      };

    case RiskLevel.BLOCKED:
      return {
        found: true,
        riskLevel,
        serviceable: true,
        codAllowed: false,
        requiresApproval: false,
        description: "COD unavailable for this entity.",
      };

    default: {
      // Exhaustive check — should never reach here
      const _exhaustive: never = riskLevel;
      throw new Error(`Unknown risk level: ${_exhaustive}`);
    }
  }
}

/* ── Lookup (used by address entry + checkout) ────────────────────────── */

/**
 * Looks up the risk behavior for a given entity.
 *
 * This is the primary function called by:
 * - TICKET-203 (address entry) to check pincode serviceability
 * - TICKET-204 (checkout) to check COD eligibility for phone/address/pincode/user
 *
 * Uses the composite index `risk_entity_idx` on (entityType, entityValue).
 */
export async function lookupRisk(
  input: unknown
): Promise<RiskLookupResult> {
  const parsed = LookupRiskFlagSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid lookup parameters",
      400
    );
  }

  const { entityType, entityValue } = parsed.data;
  const flag = await repository.findByEntity(entityType, entityValue);

  return resolveBehavior(flag?.riskLevel ?? null, entityType);
}

/**
 * Convenience: look up a pincode's serviceability + COD behavior.
 */
export async function lookupPincode(pincode: string): Promise<RiskLookupResult> {
  return lookupRisk({
    entityType: RiskEntityType.PINCODE,
    entityValue: pincode,
  });
}

/**
 * Convenience: look up a phone number's risk behavior.
 */
export async function lookupPhone(phone: string): Promise<RiskLookupResult> {
  return lookupRisk({
    entityType: RiskEntityType.PHONE,
    entityValue: phone,
  });
}

/**
 * Convenience: look up an address's risk behavior.
 */
export async function lookupAddress(addressId: string): Promise<RiskLookupResult> {
  return lookupRisk({
    entityType: RiskEntityType.ADDRESS,
    entityValue: addressId,
  });
}

/**
 * Convenience: look up a user's risk behavior.
 */
export async function lookupUser(userId: string): Promise<RiskLookupResult> {
  return lookupRisk({
    entityType: RiskEntityType.USER,
    entityValue: userId,
  });
}

/* ── CRUD (used by admin risk management — TICKET-503) ────────────────── */

/**
 * Creates a new risk flag. Rejects if a flag already exists for the
 * same (entityType, entityValue) — use updateRiskFlag to change the level.
 */
export async function createRiskFlag(input: unknown) {
  const parsed = CreateRiskFlagSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid risk flag data",
      400
    );
  }

  const { entityType, entityValue, riskLevel } = parsed.data;

  // Check for existing flag
  const existing = await repository.findByEntity(entityType, entityValue);
  if (existing) {
    throw new AppError(
      "CONFLICT",
      `A risk flag already exists for ${entityType} "${entityValue}". Use update to change the level.`,
      409
    );
  }

  return repository.create({ entityType, entityValue, riskLevel });
}

/**
 * Updates the risk level of an existing risk flag by its ID.
 */
export async function updateRiskFlag(id: string, input: unknown) {
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Risk flag ID is required", 400);
  }

  const parsed = UpdateRiskFlagSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid risk flag data",
      400
    );
  }

  const existing = await repository.findById(id);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Risk flag not found", 404);
  }

  return repository.update(id, { riskLevel: parsed.data.riskLevel });
}

/**
 * Retrieves a single risk flag by ID.
 */
export async function getRiskFlag(id: string) {
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Risk flag ID is required", 400);
  }

  const flag = await repository.findById(id);
  if (!flag) {
    throw new AppError("NOT_FOUND", "Risk flag not found", 404);
  }

  return flag;
}

/**
 * Retrieves a risk flag by its entity type and value.
 * Returns null if not found (does not throw).
 */
export async function getRiskFlagByEntity(
  entityType: RiskEntityType,
  entityValue: string
) {
  return repository.findByEntity(entityType, entityValue);
}

/**
 * Deletes a risk flag by ID.
 */
export async function deleteRiskFlag(id: string) {
  if (!id) {
    throw new AppError("VALIDATION_ERROR", "Risk flag ID is required", 400);
  }

  const existing = await repository.findById(id);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Risk flag not found", 404);
  }

  return repository.remove(id);
}

/**
 * Lists risk flags with optional filters and pagination.
 */
export async function listRiskFlags(
  query: unknown
): Promise<PaginatedRiskFlagsResult> {
  const parsed = ListRiskFlagsSchema.safeParse(query);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid query parameters",
      400
    );
  }

  return repository.list(parsed.data);
}

/**
 * Creates or updates a risk flag in a single operation (upsert).
 * If a flag for (entityType, entityValue) exists, updates its level.
 * If not, creates a new one. Returns the flag and whether it was created.
 */
export async function upsertRiskFlag(input: unknown) {
  const parsed = CreateRiskFlagSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid risk flag data",
      400
    );
  }

  const { entityType, entityValue, riskLevel } = parsed.data;

  const existing = await repository.findByEntity(entityType, entityValue);

  if (existing) {
    const updated = await repository.update(existing.id, { riskLevel });
    return { flag: updated, created: false };
  }

  const created = await repository.create({ entityType, entityValue, riskLevel });
  return { flag: created, created: true };
}
