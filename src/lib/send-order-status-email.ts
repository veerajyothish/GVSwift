import { prisma } from "@/lib/prisma";
import { render } from "@react-email/render";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { OrderStatusChangeEmail } from "@/emails/order-status-change";

// ponytail: single function to handle all order status emails without abstractions
export async function sendOrderStatusEmail(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    if (!order) {
      logger.error(`Order ${orderId} not found for email`);
      return;
    }

    const items = order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      lineTotalPaise: item.lineTotalPaise,
    }));

    const subjectMap: Record<string, string> = {
      PLACED: `Order Placed ✅ — #${order.id.slice(-8).toUpperCase()}`,
      CONFIRMED: `Order Confirmed ✅ — #${order.id.slice(-8).toUpperCase()}`,
      SHIPPED: `Order Shipped 🚚 — #${order.id.slice(-8).toUpperCase()}`,
      OUT_FOR_DELIVERY: `Out for Delivery 🚚 — #${order.id.slice(-8).toUpperCase()}`,
      DELIVERED: `Delivered! 🎉 — #${order.id.slice(-8).toUpperCase()}`,
      CANCELLED: `Order Cancelled ❌ — #${order.id.slice(-8).toUpperCase()}`,
      FAILED_DELIVERY: `Delivery Attempt Failed ⚠️ — #${order.id.slice(-8).toUpperCase()}`,
      RTO: `Returned to Origin ↩️ — #${order.id.slice(-8).toUpperCase()}`,
      RETURN_REQUESTED: `Return Requested 🔄 — #${order.id.slice(-8).toUpperCase()}`,
      RETURNED: `Return Processed ✅ — #${order.id.slice(-8).toUpperCase()}`,
    };

    const subject = subjectMap[order.status] || `Order Update — #${order.id.slice(-8).toUpperCase()}`;

    const html = await render(
      OrderStatusChangeEmail({
        orderId: order.id,
        status: order.status,
        orderUrl: `https://gvswift.com/orders/${order.id}`,
        totalPaise: order.totalPaise,
        items,
        trackingReference: order.trackingReference,
      })
    );

    await sendEmail({
      to: order.user.email,
      subject,
      html,
      sender: "orders",
    });
  } catch (error) {
    logger.error("email failed", error as string); // ponytail: simple throw-safe logging
  }
}
