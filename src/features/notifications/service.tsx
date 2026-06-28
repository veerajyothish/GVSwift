import { OrderStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { OrderPlacedEmail } from "@/emails/order-placed";
import { OrderStatusChangeEmail } from "@/emails/order-status-change";
import { SupportReplyEmail } from "@/emails/support-reply";

let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const notificationStatuses = new Set<OrderStatus>([
  OrderStatus.CONFIRMED,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
]);

type OrderForEmail = Prisma.OrderGetPayload<{
  include: {
    user: { select: { email: true } };
    items: {
      include: {
        product: { select: { name: true } };
      };
    };
  };
}>;

type SupportTicketForEmail = Prisma.SupportTicketGetPayload<{
  include: {
    user: { select: { email: true } };
  };
}>;

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gvswift.vercel.app").replace(/\/$/, "");
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

function sendEmail(params: {
  to: string | null | undefined;
  subject: string;
  react: React.ReactNode;
  idempotencyKey: string;
}) {
  const resendClient = getResend();
  if (!params.to || !resendClient) return;

  resendClient.emails
    .send(
      {
        from: senderAddress(),
        to: params.to,
        subject: params.subject,
        react: params.react,
      },
      {
        headers: {
          "Idempotency-Key": params.idempotencyKey,
        },
      }
    )
    .catch((err: unknown) => {
      console.error("[NotificationService] Email send failed:", err);
    });
}

export function sendOrderPlacedEmail(order: OrderForEmail) {
  const orderUrl = `${siteUrl()}/orders/${order.id}`;

  sendEmail({
    to: order.user.email,
    subject: `GVSwift order confirmed: ${order.id.slice(0, 8)}`,
    idempotencyKey: `order-placed-${order.id}`,
    react: (
      <OrderPlacedEmail
        orderId={order.id}
        status={order.status}
        totalPaise={order.totalPaise}
        orderUrl={orderUrl}
        items={order.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          lineTotalPaise: item.lineTotalPaise,
        }))}
      />
    ),
  });
}

export function sendOrderStatusChangeEmail(order: OrderForEmail) {
  if (!notificationStatuses.has(order.status)) return;

  sendEmail({
    to: order.user.email,
    subject: `GVSwift order status update: ${order.status.toLowerCase().replaceAll("_", " ")}`,
    idempotencyKey: `order-status-${order.id}-${order.status}`,
    react: (
      <OrderStatusChangeEmail
        orderId={order.id}
        status={order.status}
        orderUrl={`${siteUrl()}/orders/${order.id}`}
        totalPaise={order.totalPaise}
        items={order.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          lineTotalPaise: item.lineTotalPaise,
        }))}
        trackingReference={order.trackingReference}
      />
    ),
  });
}

export function sendSupportReplyEmail(ticket: SupportTicketForEmail, message: string) {
  sendEmail({
    to: ticket.user?.email,
    subject: `GVSwift support replied: ${ticket.subject}`,
    idempotencyKey: `support-reply-${ticket.id}-${Date.now()}`,
    react: (
      <SupportReplyEmail
        ticketId={ticket.id}
        subject={ticket.subject}
        replyPreview={message.length > 240 ? `${message.slice(0, 237)}...` : message}
        ticketUrl={`${siteUrl()}/support/${ticket.id}`}
      />
    ),
  });
}
