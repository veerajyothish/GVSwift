/**
 * features/admin/audit-log.ts — Audit logging utility
 *
 * TICKET-904 implements the full version. This stub defines the interface
 * so other features can import and call logAuditEvent() before TICKET-904
 * is done — the calls will be no-ops until wired up.
 *
 * Every admin mutation (product edits, order status changes, risk flag
 * changes, settings changes) MUST call logAuditEvent(). See TICKET-904
 * acceptance criteria.
 */

import { prisma } from "@/lib/prisma";

export interface AuditEventParams {
  /** ID of the admin user performing the action */
  actorId: string;
  /** Action label — use SCREAMING_SNAKE_CASE, e.g. "ORDER_STATUS_CHANGE" */
  action: string;
  /** Optional: ID of the Order this action relates to */
  orderId?: string;
  /** Optional: structured details, serialized as JSON string */
  details?: Record<string, unknown>;
}

/**
 * Writes an AuditLog row. Should be called after every admin mutation.
 * Failures are logged but never thrown — audit log failures must not
 * block the primary operation.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        orderId: params.orderId,
        details: params.details ? JSON.stringify(params.details) : undefined,
      },
    });
  } catch (err) {
    // Never throw from audit logging — log and continue
    console.error("[AuditLog] Failed to write audit event:", err, params);
  }
}
