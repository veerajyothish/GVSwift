import React from "react";
import { inngest } from "./client";
import { prisma } from "../prisma";
import { Resend } from "resend";
import { OrderStatusChangeEmail } from "@/emails/order-status-change";
import { getLoyaltySettings, awardPoints } from "@/lib/loyalty";
import { withRetry } from "@/lib/retry";
import { OrderStatus } from "@prisma/client";
import { getSiteUrl } from "@/lib/env";

const resend = new Resend(process.env.RESEND_API_KEY);

function siteUrl() {
  return getSiteUrl();
}

function senderAddress() {
  if (process.env.RESEND_FROM_EMAIL) {
    return process.env.RESEND_FROM_EMAIL;
  }
  const hostname = new URL(siteUrl()).hostname;
  if (hostname.endsWith("vercel.app") || hostname === "localhost") {
    return "GVSwift <onboarding@resend.dev>";
  }
  return `GVSwift <orders@${hostname}>`;
}

// 1. Order Placed Email Function
export const orderPlacedEmail = inngest.createFunction(
  { id: "order-placed-email", triggers: [{ event: "order/placed" }] },
  async ({ event }) => {
    const { orderId } = event.data;

    const order = await withRetry(() =>
      prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { email: true } },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      })
    );

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const orderUrl = `${siteUrl()}/orders/${order.id}`;

    const customerEmailPromise = withRetry(() =>
      resend.emails.send({
        from: senderAddress(),
        to: order.user.email,
        subject: `Order Confirmed — #${order.id.slice(-8).toUpperCase()} | GVSwift`,
        react: (
          <OrderStatusChangeEmail
            orderId={order.id}
            status={OrderStatus.PLACED}
            orderUrl={orderUrl}
            totalPaise={order.totalPaise}
            items={order.items.map((item) => ({
              name: item.product.name,
              quantity: item.quantity,
              lineTotalPaise: item.lineTotalPaise,
            }))}
          />
        ),
      })
    );

    const adminEmailPromise = withRetry(() =>
      resend.emails.send({
        from: senderAddress(),
        to: process.env.ADMIN_EMAIL ?? "gvswift.help@gmail.com",
        subject: `[New Order] #${order.id.slice(-8).toUpperCase()} placed by ${order.user.email}`,
        react: (
          <OrderStatusChangeEmail
            orderId={order.id}
            status={OrderStatus.PLACED}
            orderUrl={`${siteUrl()}/admin/orders/${order.id}`}
            totalPaise={order.totalPaise}
            items={order.items.map((item) => ({
              name: item.product.name,
              quantity: item.quantity,
              lineTotalPaise: item.lineTotalPaise,
            }))}
          />
        ),
      })
    );

    await Promise.all([customerEmailPromise, adminEmailPromise]);

    return { status: "sent", orderId };
  }
);

// 2. Order Status Change Email Function
export const orderStatusChangedEmail = inngest.createFunction(
  { id: "order-status-changed-email", triggers: [{ event: "order/status.changed" }] },
  async ({ event }) => {
    const { orderId, status } = event.data;

    const order = await withRetry(() =>
      prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { email: true } },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      })
    );

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const orderUrl = `${siteUrl()}/orders/${order.id}`;
    const statusLabel = (status as string).toLowerCase().replaceAll("_", " ");

    await withRetry(() =>
      resend.emails.send({
        from: senderAddress(),
        to: order.user.email,
        subject: `GVSwift order status update: ${statusLabel}`,
        react: (
          <OrderStatusChangeEmail
            orderId={order.id}
            status={status as OrderStatus}
            orderUrl={orderUrl}
            totalPaise={order.totalPaise}
            items={order.items.map((item) => ({
              name: item.product.name,
              quantity: item.quantity,
              lineTotalPaise: item.lineTotalPaise,
            }))}
            trackingReference={order.trackingReference}
          />
        ),
      })
    );

    return { status: "sent", orderId, nextStatus: status };
  }
);

// 3. Loyalty Points Calculation Function
export const loyaltyPointsCalculation = inngest.createFunction(
  { id: "loyalty-points-calculation", triggers: [{ event: "order/delivered" }] },
  async ({ event }) => {
    const { orderId, userId } = event.data;

    await withRetry(async () => {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      const settings = await getLoyaltySettings();

      // 1. Award purchase points if not already awarded
      const existingPurchasePoints = await prisma.pointsLedger.findFirst({
        where: { orderId, delta: { gt: 0 } },
      });

      if (!existingPurchasePoints) {
        const amountPaidRupees = Math.floor(order.totalPaise / 100);
        const pointsEarned = amountPaidRupees * settings.pointsPerRupee;
        if (pointsEarned > 0) {
          await awardPoints(
            userId,
            pointsEarned,
            `Purchase — Order #${orderId.slice(-8).toUpperCase()}`,
            orderId
          );
        }
      }

      // 2. Award referral bonus if not already awarded
      const referralUse = await prisma.referralUse.findUnique({
        where: { referredUserId: userId },
        include: { referralCode: { select: { userId: true } } },
      });
      if (referralUse && referralUse.pointsAwarded === 0) {
        const referrerId = referralUse.referralCode.userId;
        await awardPoints(
          referrerId,
          settings.referralBonus,
          `Referral bonus — friend placed their first order`,
          orderId
        );
        await prisma.referralUse.update({
          where: { id: referralUse.id },
          data: { pointsAwarded: settings.referralBonus },
        });
      }
    });

    return { status: "processed", orderId };
  }
);
