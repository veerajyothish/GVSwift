/**
 * features/risk/validation.ts — Zod schemas for risk flag operations
 */

import { z } from "zod";

const RiskEntityTypeEnum = z.enum(["PHONE", "ADDRESS", "PINCODE", "USER"]);
const RiskLevelEnum = z.enum(["LOW", "MEDIUM", "HIGH", "BLOCKED"]);

export const CreateRiskFlagSchema = z.object({
  entityType: RiskEntityTypeEnum,
  entityValue: z
    .string()
    .min(1, "Entity value is required")
    .max(255, "Entity value too long"),
  riskLevel: RiskLevelEnum,
});

export const UpdateRiskFlagSchema = z.object({
  riskLevel: RiskLevelEnum,
});

export const LookupRiskFlagSchema = z.object({
  entityType: RiskEntityTypeEnum,
  entityValue: z
    .string()
    .min(1, "Entity value is required")
    .max(255, "Entity value too long"),
});

export const ListRiskFlagsSchema = z.object({
  entityType: RiskEntityTypeEnum.optional(),
  entityValue: z.string().max(255).optional(),
  riskLevel: RiskLevelEnum.optional(),
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .default(20),
});
