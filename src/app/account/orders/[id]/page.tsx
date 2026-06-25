import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getUserOrderDetail, isWithinReturnWindow } from "@/features/orders/service";
import { getReturnWindowDays } from "@/features/settings/service";
import OrderDetailClient from "./OrderDetailClient";
import { Metadata } from "next";
import { AppError } from "@/lib/errors";

export const metadata: Metadata = {
  title: "Order Details",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id: orderId } = await params;

  let order;
  try {
    order = await getUserOrderDetail(user.id, orderId);
  } catch (err) {
    if (err instanceof AppError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  // Determine return eligibility for DELIVERED orders
  let canReturn = false;
  let returnWindowDays = 7;
  if (order.status === "DELIVERED") {
    [canReturn, returnWindowDays] = await Promise.all([
      isWithinReturnWindow(orderId),
      getReturnWindowDays(),
    ]);
  }

  // Check if order is pre-shipped (can cancel)
  const canCancel = order.status === "PLACED" || order.status === "CONFIRMED";

  // Serialize for client component
  const serializedOrder = {
    id: order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotalPaise: order.subtotalPaise,
    shippingPaise: order.shippingPaise,
    codFeePaise: order.codFeePaise,
    totalPaise: order.totalPaise,
    trackingReference: order.trackingReference,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPricePaise: item.unitPricePaise,
      lineTotalPaise: item.lineTotalPaise,
      productName: item.product?.name ?? "Unknown Product",
      productSlug: item.product?.slug ?? "",
      productImage: item.product?.images?.[0]?.url ?? null,
      variantSku: item.variant?.sku ?? null,
      variantAttributes: item.variant ? (item.variant as unknown as { priceDeltaPaise: number }).priceDeltaPaise : null,
    })),
    statusHistory: order.statusHistory.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      reason: h.reason,
      changedById: h.changedById,
      createdAt: h.createdAt.toISOString(),
    })),
    address: {
      fullName: order.address.fullName,
      line1: order.address.line1,
      line2: order.address.line2,
      city: order.address.city,
      state: order.address.state,
      pincode: order.address.pincode,
      phone: order.address.phone,
    },
  };

  return (
    <div className="w-full px-4 md:px-0">
      <OrderDetailClient
        order={serializedOrder}
        canCancel={canCancel}
        canReturn={canReturn}
        returnWindowDays={returnWindowDays}
      />
    </div>
  );
}
