/**
 * features/orders/state-machine.ts — Order State Machine Service
 *
 * TICKET-301: Enforces order status transition rules, permission limits,
 * settings boundaries (cancellation cutoffs, retry thresholds, return windows),
 * and the safety stock re-check on confirmation.
 *
 * Every transition creates an OrderStatusHistory row. Admin overrides log audits.
 */

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { OrderStatus, Role, Prisma } from "@prisma/client";
import { logAuditEvent } from "@/features/admin/audit-log";
import { inngest } from "@/lib/inngest/client";
import { withRetry } from "@/lib/retry";
import { logger } from "@/lib/logger";

/* ── Transition Configuration ────────────────────────────────────────── */

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.CANCELLED, OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.FAILED_DELIVERY],
  [OrderStatus.FAILED_DELIVERY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.RTO],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURN_REQUESTED],
  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED, OrderStatus.DELIVERED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RTO]: [],
  [OrderStatus.RETURNED]: [],
};

/**
 * Checks if a transition path and its role context is structurally allowed.
 */
function isTransitionAllowed(
  from: OrderStatus,
  to: OrderStatus,
  actorRole: Role | null,
  isSystem: boolean
): boolean {
  // Post-shipped cancellations (SHIPPED, OUT_FOR_DELIVERY, FAILED_DELIVERY) are allowed only for ADMIN
  if (to === OrderStatus.CANCELLED) {
    if (from === OrderStatus.PLACED || from === OrderStatus.CONFIRMED) {
      return true; // allowed for USER or ADMIN
    }
    if (
      from === OrderStatus.SHIPPED ||
      from === OrderStatus.OUT_FOR_DELIVERY ||
      from === OrderStatus.FAILED_DELIVERY
    ) {
      return actorRole === Role.ADMIN;
    }
    return false;
  }

  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    return false;
  }

  // Check required roles for transitions
  switch (to) {
    case OrderStatus.CONFIRMED:
    case OrderStatus.SHIPPED:
    case OrderStatus.OUT_FOR_DELIVERY:
    case OrderStatus.DELIVERED:
    case OrderStatus.FAILED_DELIVERY:
    case OrderStatus.RETURNED:
      return actorRole === Role.ADMIN;

    case OrderStatus.RTO:
      return isSystem || actorRole === Role.ADMIN;

    case OrderStatus.RETURN_REQUESTED:
      return actorRole === Role.USER || actorRole === Role.ADMIN;

    default:
      return false;
  }
}

/**
 * Safe transaction-scoped getter for configuration settings.
 */
async function getSettingForTx(tx: Prisma.TransactionClient, key: string, fallback: number): Promise<number> {
  try {
    const row = await tx.setting.findUnique({ where: { key } });
    if (row) {
      return JSON.parse(row.value);
    }
  } catch (err) {
    console.error(`[SettingsSM] Error reading settings key ${key}:`, err);
  }
  return fallback;
}

/* ── Main Service Function ────────────────────────────────────────────── */

/**
 * Transitions an order's status.
 * Evaluates path rules, permission guards, configuration limits, and stock availability.
 *
 * @param orderId - Order UUID
 * @param toStatus - Target status
 * @param actorId - ID of user triggering the change (null for system actions)
 * @param actorRole - Role of user triggering the change (null for system actions)
 * @param reason - Mandatory for post-shipped cancellation overrides, optional otherwise
 */
export async function transitionOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  actorId: string | null,
  actorRole: Role | null,
  reason: string | null = null
) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch order with items
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError("NOT_FOUND", "Order not found", 404);
    }

    // No-op if status matches target status
    if (order.status === toStatus) {
      return {
        order,
        fromStatus: order.status,
        actualToStatus: order.status,
      };
    }

    const isSystem = actorId === null;

    // 2. Validate structural transition eligibility
    if (!isTransitionAllowed(order.status, toStatus, actorRole, isSystem)) {
      throw new AppError(
        "INVALID_TRANSITION",
        `Transition from ${order.status} to ${toStatus} is invalid or unauthorized.`,
        400
      );
    }

    // 3. Post-shipped cancellation requires reason
    if (
      toStatus === OrderStatus.CANCELLED &&
      (order.status === OrderStatus.SHIPPED ||
        order.status === OrderStatus.OUT_FOR_DELIVERY ||
        order.status === OrderStatus.FAILED_DELIVERY)
    ) {
      if (!reason || !reason.trim()) {
        throw new AppError(
          "VALIDATION_ERROR",
          "A reason is mandatory for admin cancellation overrides.",
          400
        );
      }
    }

    // 4. Configuration-based constraints
    // (a) FAILED_DELIVERY retry limit check
    if (order.status === OrderStatus.FAILED_DELIVERY && toStatus === OrderStatus.OUT_FOR_DELIVERY) {
      const maxAttempts = await getSettingForTx(tx, "max_delivery_attempts", 2);
      if (order.deliveryAttempts >= maxAttempts) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Cannot retry delivery. Maximum delivery attempts (${maxAttempts}) reached.`,
          400
        );
      }
    }

    // (b) FAILED_DELIVERY RTO enforcement check
    if (order.status === OrderStatus.FAILED_DELIVERY && toStatus === OrderStatus.RTO) {
      const maxAttempts = await getSettingForTx(tx, "max_delivery_attempts", 2);
      if (order.deliveryAttempts < maxAttempts) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Cannot transition to RTO. Delivery attempts (${order.deliveryAttempts}) are below maximum attempts (${maxAttempts}).`,
          400
        );
      }
    }

    // (c) DELIVERED -> RETURN_REQUESTED return window check
    if (order.status === OrderStatus.DELIVERED && toStatus === OrderStatus.RETURN_REQUESTED) {
      const deliveryHistory = await tx.orderStatusHistory.findFirst({
        where: { orderId, toStatus: OrderStatus.DELIVERED },
        orderBy: { createdAt: "desc" },
      });
      const deliveredAt = deliveryHistory?.createdAt ?? order.updatedAt;
      const returnWindowDays = await getSettingForTx(tx, "return_window_days", 7);
      const diffTime = Date.now() - deliveredAt.getTime();
      if (diffTime > returnWindowDays * 24 * 60 * 60 * 1000) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Return window of ${returnWindowDays} days has expired.`,
          400
        );
      }
    }

    // 5. Special PLACED -> CONFIRMED stock re-check
    if (order.status === OrderStatus.PLACED && toStatus === OrderStatus.CONFIRMED) {
      const insufficientStockChecks: boolean[] = [];
      const variantDeductions: Array<{ variantId: string; quantity: number }> = [];

      for (const item of order.items) {
        if (item.variantId) {
          // Lock row to prevent race conditions
          const variants = await tx.$queryRaw<Array<{ id: string; stock: number }>>`
            SELECT id, stock FROM "ProductVariant" WHERE id = ${item.variantId}::uuid FOR UPDATE
          `;
          const stock = variants[0]?.stock ?? 0;
          // Since stock was already deducted at order placement,
          // if stock is negative, it means it was manually corrected or oversold
          insufficientStockChecks.push(stock < 0);
          variantDeductions.push({ variantId: item.variantId, quantity: item.quantity });
        }
      }

      const hasInsufficientStock = insufficientStockChecks.some(Boolean);
      if (hasInsufficientStock) {
        // Auto-cancel full order
        const updated = await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CANCELLED },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            fromStatus: OrderStatus.PLACED,
            toStatus: OrderStatus.CANCELLED,
            changedById: null, // System-triggered
            reason: "Auto-cancelled: insufficient stock at confirmation",
          },
        });

        // Release reserved stock back
        for (const item of variantDeductions) {
          await tx.$executeRaw`
            UPDATE "ProductVariant"
            SET stock = stock + ${item.quantity}
            WHERE id = ${item.variantId}::uuid
          `;
        }

        return {
          order: updated,
          fromStatus: order.status,
          actualToStatus: OrderStatus.CANCELLED,
        };
      }
    }

    // 6. Normal Transition Commit
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: toStatus,
        deliveryAttempts: toStatus === OrderStatus.FAILED_DELIVERY ? { increment: 1 } : undefined,
      },
    });

    // 7. Write history log
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus,
        changedById: actorId,
        reason,
      },
    });

    // 8. Release stock if manually transitioning to CANCELLED
    if (toStatus === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.$executeRaw`
            UPDATE "ProductVariant"
            SET stock = stock + ${item.quantity}
            WHERE id = ${item.variantId}::uuid
          `;
        }
      }
    }

    return {
      order: updated,
      fromStatus: order.status,
      actualToStatus: toStatus,
    };
  }, {
    maxWait: 15000,
    timeout: 30000,
  });

  // 9. Admin audit log integration (if actor is admin, run outside transaction to avoid connection starvation)
  const { fromStatus, actualToStatus } = result;
  if (actorRole === Role.ADMIN && actorId && fromStatus && actualToStatus && fromStatus !== actualToStatus) {
    await logAuditEvent({
      actorId,
      action: "ORDER_STATUS_CHANGE",
      orderId,
      details: {
        fromStatus,
        toStatus: actualToStatus,
        reason,
      },
    });
  }

  if (fromStatus !== actualToStatus) {
    const orderForEmail = await prisma.order.findUnique({
      where: { id: result.order.id },
      include: {
        user: { select: { email: true } },
      },
    });

    if (orderForEmail) {
      await withRetry(() =>
        inngest.send({
          name: "order/status.changed",
          data: {
            orderId: result.order.id,
            status: actualToStatus,
            userId: result.order.userId,
            email: orderForEmail.user.email,
          },
        })
      );
    }

    // Award loyalty points ONLY on transitions to DELIVERED status
    if (actualToStatus === OrderStatus.DELIVERED) {
      await withRetry(() =>
        inngest.send({
          name: "order/delivered",
          data: {
            orderId: result.order.id,
            userId: result.order.userId,
          },
        })
      );
    }

    // Structured logging for status changes
    logger.info(
      {
        orderId: result.order.id,
        from: fromStatus,
        to: actualToStatus,
        changedBy: actorId,
      },
      "Order status changed"
    );
  }

  return result.order;
}
