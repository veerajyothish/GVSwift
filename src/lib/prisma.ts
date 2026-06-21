/**
 * lib/prisma.ts — Prisma Client singleton
 *
 * Uses the global pattern to prevent multiple PrismaClient instances during
 * Next.js hot-reloading in development. In production there is only one
 * module evaluation so the singleton branch is never hit.
 *
 * Connection goes through Supabase PgBouncer (DATABASE_URL, port 6543) for
 * regular queries, with DIRECT_URL (port 5432) used for migrations only.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
