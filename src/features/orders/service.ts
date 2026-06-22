/**
 * features/orders/service.ts — Order query + action service
 *
 * TICKET-302: Customer-facing order reads with strict ownership enforcement.
 * TICKET-303: Customer cancellation flow.
 * Every query scopes by userId to prevent IDOR — accessing another user's
 * order returns NOT_FOUND (never FORBIDDEN), per docs/03-Security-Access.md §2.
 */

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { getReturnWindowDays } from "@/features/settings/service";
import { transitionOrderStatus } from "@/features/orders/state-machine";
import { OrderStatus, Role } from "@prisma/client";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface OrderListItem {
  id: string;
  status: OrderStatus;
  totalPaise: number;
  createdAt: Date;
  itemCount: number;
  firstItemName: string;
  firstItemImage: string | null;
}

export interface OrderListResult {
  orders: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ── Paginated list of user's orders ────────────────────────────────────── */

/**
 * Returns a paginated list of the authenticated user's orders.
 * Ordered by createdAt DESC (newest first).
 */
export async function listUserOrders(
  userId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<OrderListResult> {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(50, Math.max(1, Math.floor(pageSize)));
  const skip = (safePage - 1) * safePageSize;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: safePageSize,
      include: {
        items: {
          take: 1,
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  const mapped: OrderListItem[] = orders.map((o) => ({
    id: o.id,
    status: o.status,
    totalPaise: o.totalPaise,
    createdAt: o.createdAt,
    itemCount: o._count.items,
    firstItemName: o.items[0]?.product?.name ?? "Unknown Product",
    firstItemImage: o.items[0]?.product?.images?.[0]?.url ?? null,
  }));

  return {
    orders: mapped,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(total / safePageSize),
  };
}

/* ── Single order detail with ownership check ──────────────────────────── */

/**
 * Returns full order detail including items, status history, and address.
 * Throws NOT_FOUND if the order doesn't exist OR doesn't belong to the user
 * (indistinguishable from "not found" to prevent IDOR information leakage).
 */
export async function getUserOrderDetail(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
      address: true,
    },
  });

  // Ownership check: return identical NOT_FOUND for missing or wrong-user orders
  if (!order || order.userId !== userId) {
    throw new AppError("NOT_FOUND", "Order not found", 404);
  }

  return order;
}

/* ── Return eligibility check ──────────────────────────────────────────── */

/**
 * Determines if a DELIVERED order is within the return window.
 * Reads the delivered-at timestamp from OrderStatusHistory.
 */
export async function isWithinReturnWindow(orderId: string): Promise<boolean> {
  const deliveryHistory = await prisma.orderStatusHistory.findFirst({
    where: { orderId, toStatus: "DELIVERED" },
    orderBy: { createdAt: "desc" },
  });

  if (!deliveryHistory) return false;

  const returnWindowDays = await getReturnWindowDays();
  const deliveredAt = deliveryHistory.createdAt;
  const diffMs = Date.now() - deliveredAt.getTime();
  const windowMs = returnWindowDays * 24 * 60 * 60 * 1000;

  return diffMs <= windowMs;
}

/* ── Customer Cancellation (TICKET-303) ────────────────────────────────── */

/**
 * Cancels a customer's own order. Enforces:
 *   - Ownership (404 for wrong user or missing order)
 *   - Status must be PLACED or CONFIRMED (pre-SHIPPED)
 *   - Reason is required
 *
 * Stock release is handled by the state machine's transitionOrderStatus()
 * (step 8 in state-machine.ts). This function does NOT duplicate that logic.
 */
export async function cancelOrder(
  userId: string,
  orderId: string,
  reason: string
): Promise<void> {
  // 1. Validate reason
  const trimmedReason = (reason ?? "").trim();
  if (!trimmedReason) {
    throw new AppError(
      "VALIDATION_ERROR",
      "A cancellation reason is required.",
      400
    );
  }

  if (trimmedReason.length > 500) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Cancellation reason must be under 500 characters.",
      400
    );
  }

  // 2. Ownership check — load order and verify userId
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, status: true },
  });

  if (!order || order.userId !== userId) {
    throw new AppError("NOT_FOUND", "Order not found", 404);
  }

  // 3. Pre-shipped check — customer can only cancel PLACED or CONFIRMED
  if (
    order.status !== OrderStatus.PLACED &&
    order.status !== OrderStatus.CONFIRMED
  ) {
    throw new AppError(
      "INVALID_TRANSITION",
      `Cannot cancel an order with status "${order.status}". Cancellation is only allowed before the order is shipped.`,
      400
    );
  }

  // 4. Delegate to state machine — handles the transition, history row, and stock release
  await transitionOrderStatus(
    orderId,
    OrderStatus.CANCELLED,
    userId,
    Role.USER,
    trimmedReason
  );
}

/* ── Customer Return Request (TICKET-304) ────────────────────────────────── */

/**
 * Requests a return on a customer's own order. Enforces:
 *   - Ownership (404 for wrong user or missing order)
 *   - Status must be DELIVERED
 *   - Date must be within return window
 *   - Reason is required
 */
export async function requestReturn(
  userId: string,
  orderId: string,
  reason: string
): Promise<void> {
  const trimmedReason = (reason ?? "").trim();
  if (!trimmedReason) {
    throw new AppError(
      "VALIDATION_ERROR",
      "A return reason is required.",
      400
    );
  }

  if (trimmedReason.length > 500) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Return reason must be under 500 characters.",
      400
    );
  }

  // 1. Ownership check — load order and verify userId
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, status: true },
  });

  if (!order || order.userId !== userId) {
    throw new AppError("NOT_FOUND", "Order not found", 404);
  }

  // 2. Status check — must be DELIVERED
  if (order.status !== OrderStatus.DELIVERED) {
    throw new AppError(
      "INVALID_TRANSITION",
      `Cannot request return on an order with status "${order.status}". Returns are only allowed for delivered orders.`,
      400
    );
  }

  // 3. Return window check
  const withinWindow = await isWithinReturnWindow(orderId);
  if (!withinWindow) {
    const returnWindowDays = await getReturnWindowDays();
    throw new AppError(
      "VALIDATION_ERROR",
      `Return window of ${returnWindowDays} days has expired.`,
      400
    );
  }

  // 4. Delegate to state machine — handles the transition, return window check, and history row
  await transitionOrderStatus(
    orderId,
    OrderStatus.RETURN_REQUESTED,
    userId,
    Role.USER,
    trimmedReason
  );
}


