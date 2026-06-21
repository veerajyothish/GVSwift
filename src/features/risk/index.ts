/**
 * features/risk/index.ts — Barrel exports for the risk domain
 */

// Service (primary API for other domains)
export {
  lookupRisk,
  lookupPincode,
  lookupPhone,
  lookupAddress,
  lookupUser,
  createRiskFlag,
  updateRiskFlag,
  getRiskFlag,
  getRiskFlagByEntity,
  deleteRiskFlag,
  listRiskFlags,
  upsertRiskFlag,
} from "./service";

// Types
export type {
  RiskLookupResult,
  CreateRiskFlagParams,
  UpdateRiskFlagParams,
  ListRiskFlagsParams,
  PaginatedRiskFlagsResult,
} from "./types";

export { RiskEntityType, RiskLevel } from "./types";
