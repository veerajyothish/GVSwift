/**
 * features/risk/repository.ts — Prisma queries for RiskFlag
 *
 * All queries use the composite index `risk_entity_idx` on
 * (entityType, entityValue) — no full table scans.
 */

import { prisma } from "@/lib/prisma";
import { RiskEntityType, RiskLevel, Prisma } from "@prisma/client";
import type { PaginatedRiskFlagsResult } from "./types";

/**
 * Finds a single RiskFlag by entity type + value.
 * Uses the composite index `risk_entity_idx`.
 */
export async function findByEntity(
  entityType: RiskEntityType,
  entityValue: string
) {
  return prisma.riskFlag.findFirst({
    where: { entityType, entityValue },
  });
}

/**
 * Finds a RiskFlag by its primary key ID.
 */
export async function findById(id: string) {
  return prisma.riskFlag.findUnique({
    where: { id },
  });
}

/**
 * Creates a new RiskFlag row.
 */
export async function create(data: {
  entityType: RiskEntityType;
  entityValue: string;
  riskLevel: RiskLevel;
}) {
  return prisma.riskFlag.create({ data });
}

/**
 * Updates the risk level of an existing RiskFlag by ID.
 */
export async function update(id: string, data: { riskLevel: RiskLevel }) {
  return prisma.riskFlag.update({
    where: { id },
    data,
  });
}

/**
 * Deletes a RiskFlag by ID.
 */
export async function remove(id: string) {
  return prisma.riskFlag.delete({
    where: { id },
  });
}

/**
 * Lists RiskFlags with optional filters and pagination.
 * All filter combinations hit the composite index when entityType is provided.
 */
export async function list(
  params: {
    entityType?: RiskEntityType;
    entityValue?: string;
    riskLevel?: RiskLevel;
    page?: number;
    limit?: number;
  } = {}
): Promise<PaginatedRiskFlagsResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(100, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Prisma.RiskFlagWhereInput = {};

  if (params.entityType) {
    where.entityType = params.entityType;
  }

  if (params.entityValue) {
    // Exact match — uses the composite index when entityType is also set
    where.entityValue = params.entityValue;
  }

  if (params.riskLevel) {
    where.riskLevel = params.riskLevel;
  }

  const [totalCount, flags] = await Promise.all([
    prisma.riskFlag.count({ where }),
    prisma.riskFlag.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    flags,
    totalCount,
    page,
    limit,
    totalPages,
  };
}
