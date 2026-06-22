/**
 * features/orders/service.ts — Order query + action service
 *
 * TICKET-302: Customer-facing order reads with strict ownership enforcement.
 * Every query scopes by userId to prevent IDOR — accessing another user's
 * order returns NOT_FOUND (never FORBIDDEN), per docs/03-Security-Access.md §2.
 */

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { getReturnWindowDays } from "@/features/settings/service";
import type { OrderStatus } from "@prisma/client";

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
