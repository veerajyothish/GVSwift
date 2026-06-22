/**
 * features/admin/audit-log.ts — Audit logging utility
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
  /** Optional: logical target type, e.g. "ORDER", "SETTING", "RISK_FLAG" */
  targetType?: string;
  /** Optional: logical target identifier */
  targetId?: string | null;
  /** Optional: ID of the Order this action relates to */
  orderId?: string;
  /** Optional: structured details, serialized as JSON string */
  details?: Record<string, unknown>;
}

type TargetType = "ORDER" | "SETTING" | "RISK_FLAG" | "PRODUCT" | "SUPPORT_TICKET" | string;
type NormalizedAuditEventParams = Omit<AuditEventParams, "actorId"> & {
  actorId: string | null;
};

/**
 * Writes an AuditLog row after every admin mutation.
 *
 * Preferred TICKET-904 signature:
 *   logAuditEvent(action, adminId, targetType, targetId, details)
 *
 * Existing object-style calls are also supported so current admin routes keep
 * resolving while they migrate to the positional form.
 *
 * Failures are logged but never thrown — audit log failures must not
 * block the primary operation.
 */
export function logAuditEvent(
  action: string,
  adminId: string | null,
  targetType?: TargetType,
  targetId?: string | null,
  details?: Record<string, unknown>
): void;
export function logAuditEvent(params: AuditEventParams): void;
export function logAuditEvent(
  actionOrParams: string | AuditEventParams,
  adminId?: string | null,
  targetType?: TargetType,
  targetId?: string | null,
  details?: Record<string, unknown>
): void {
  const params: NormalizedAuditEventParams =
    typeof actionOrParams === "string"
      ? {
          action: actionOrParams,
          actorId: adminId ?? null,
          targetType,
          targetId,
          details,
        }
      : {
          ...actionOrParams,
          actorId: actionOrParams.actorId ?? null,
        };

  const normalizedTargetType = params.targetType?.toUpperCase();
  const normalizedTargetId = params.targetId ?? params.orderId ?? null;
  const orderId =
    params.orderId ??
    (normalizedTargetType === "ORDER" ? normalizedTargetId ?? undefined : undefined);

  const serializedDetails = JSON.stringify({
    ...(params.targetType ? { targetType: params.targetType } : {}),
    ...(normalizedTargetId ? { targetId: normalizedTargetId } : {}),
    ...(params.details ?? {}),
  });

  void prisma.auditLog
    .create({
      data: {
        actorId: params.actorId,
        action: params.action,
        orderId,
        details: serializedDetails,
      },
    })
    .catch((err: unknown) => {
      console.error("[AuditLog] Failed to write audit event:", err, params);
    });
}
