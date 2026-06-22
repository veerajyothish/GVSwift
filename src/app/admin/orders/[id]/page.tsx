import React from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminOrderDetail } from "@/features/orders/service";
import { getMaxDeliveryAttempts } from "@/features/settings/service";
import OrderDetailManager from "./OrderDetailManager";
import { Metadata } from "next";
import { AppError } from "@/lib/errors";

export const metadata: Metadata = {
  title: "Admin Order Details",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  // Enforces admin permissions on the server
  await requireAdmin();

  const { id: orderId } = await params;

  let detail;
  try {
    detail = await getAdminOrderDetail(orderId);
  } catch (err) {
    if (err instanceof AppError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const maxDeliveryAttempts = await getMaxDeliveryAttempts();

  // Serialize order details for client component
  const serializedOrder = {
    id: detail.id,
    userId: detail.userId,
    status: detail.status,
    paymentMethod: detail.paymentMethod,
    subtotalPaise: detail.subtotalPaise,
    shippingPaise: detail.shippingPaise,
    codFeePaise: detail.codFeePaise,
    totalPaise: detail.totalPaise,
    trackingReference: detail.trackingReference,
    deliveryAttempts: detail.deliveryAttempts,
    internalNotes: detail.internalNotes,
    createdAt: detail.createdAt.toISOString(),
    updatedAt: detail.updatedAt.toISOString(),
    customer: {
      email: detail.user.email,
      phone: detail.user.phone,
      riskStatus: detail.user.riskStatus,
    },
    items: detail.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPricePaise: item.unitPricePaise,
      lineTotalPaise: item.lineTotalPaise,
      productName: item.product?.name ?? "Unknown Product",
      productSlug: item.product?.slug ?? "",
      productImage: item.product?.images?.[0]?.url ?? null,
      variantSku: item.variant?.sku ?? null,
    })),
    statusHistory: detail.statusHistory.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      reason: h.reason,
      changedByEmail: h.changedBy?.email ?? null,
      changedByRole: h.changedBy?.role ?? null,
      createdAt: h.createdAt.toISOString(),
    })),
    address: {
      fullName: detail.address.fullName,
      line1: detail.address.line1,
      line2: detail.address.line2,
      city: detail.address.city,
      state: detail.address.state,
      pincode: detail.address.pincode,
      phone: detail.address.phone,
    },
    riskFlags: detail.riskFlags.map((rf) => ({
      id: rf.id,
      entityType: rf.entityType,
      entityValue: rf.entityValue,
      riskLevel: rf.riskLevel,
      createdAt: rf.createdAt.toISOString(),
    })),
  };

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "16px 0" }}>
        <OrderDetailManager
          order={serializedOrder}
          maxDeliveryAttempts={maxDeliveryAttempts}
        />
      </main>
    </div>
  );
}
