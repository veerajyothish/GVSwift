/**
 * PUT /api/v1/admin/orders/[id]
 *
 * Administrative order mutation endpoint — updates status, tracking reference,
 * or internal notes for an order. Requires ADMIN role.
 *
 * Request body (JSON):
 *   {
 *     status?: OrderStatus,
 *     reason?: string,              // required if status is a post-shipped cancel override
 *     trackingReference?: string,
 *     internalNotes?: string
 *   }
 *
 * Responses:
 *   200 { success: true, order }
 *   400 { error, code }     — validation / invalid transition
 *   401 { error, code }     — not authenticated
 *   403 { error, code }     — not admin
 *   404 { error, code }     — order not found
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { transitionOrderStatus } from "@/features/orders/state-machine";
import { logAuditEvent } from "@/features/admin/audit-log";
import { toSafeError, AppError } from "@/lib/errors";
import { OrderStatus, Role } from "@prisma/client";
import { sendOrderStatusEmail } from "@/lib/send-order-status-email";
import { logger } from "@/lib/logger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const { id: orderId } = await params;

    // Load order to verify existence
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { status, reason, trackingReference, internalNotes } = body as {
      status?: OrderStatus;
      reason?: string;
      trackingReference?: string;
      internalNotes?: string;
    };

    // 1. Handle Status Transition (if provided)
    const statusOrder = status
      ? await transitionOrderStatus(
        orderId,
        status,
        user.id,
        Role.ADMIN,
        reason || null
      )
      : order;

    // 2. Handle fields updates (trackingReference, internalNotes)
    const updateData: { trackingReference?: string | null; internalNotes?: string | null } = {};
    const auditDetails: Record<string, { previous: string | null; new: string | null }> = {};

    if (trackingReference !== undefined) {
      const trimmedRef = (trackingReference ?? "").trim() || null;
      if (trimmedRef && trimmedRef.length > 500) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Tracking reference must be under 500 characters.",
          400
        );
      }
      updateData.trackingReference = trimmedRef;
      auditDetails.trackingReference = { previous: order.trackingReference, new: trimmedRef };
    }

    if (internalNotes !== undefined) {
      const trimmedNotes = (internalNotes ?? "").trim() || null;
      if (trimmedNotes && trimmedNotes.length > 5000) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Internal notes must be under 5000 characters.",
          400
        );
      }
      updateData.internalNotes = trimmedNotes;
      auditDetails.internalNotes = { previous: order.internalNotes, new: trimmedNotes };
    }

    if (Object.keys(updateData).length > 0) {
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
      });

      // Write audit log for field modifications
      await logAuditEvent({
        actorId: user.id,
        action: "ORDER_UPDATE",
        orderId: order.id,
        details: auditDetails,
      });
      return NextResponse.json({ success: true, order: updatedOrder });
    }

    if (status) {
      // ponytail: fire and forget email on status change
      sendOrderStatusEmail(orderId).catch((e) => logger.error('email failed', e));
    }
    return NextResponse.json({ success: true, order: statusOrder });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
