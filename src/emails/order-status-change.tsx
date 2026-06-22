import type { OrderStatus } from "@prisma/client";

export interface OrderStatusChangeEmailProps {
  orderId: string;
  status: OrderStatus;
  orderUrl: string;
  trackingReference?: string | null;
}

const statusCopy: Partial<Record<OrderStatus, string>> = {
  SHIPPED: "Your GVSwift order has shipped.",
  DELIVERED: "Your GVSwift order has been delivered.",
  CANCELLED: "Your GVSwift order has been cancelled.",
};

export function OrderStatusChangeEmail({
  orderId,
  status,
  orderUrl,
  trackingReference,
}: OrderStatusChangeEmailProps) {
  return (
    <html>
      <body style={{ margin: 0, backgroundColor: "#0B0B0C", color: "#FAF8F3", fontFamily: "Arial, sans-serif" }}>
        <main style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 20px" }}>
          <section style={{ backgroundColor: "#1F1F22", border: "1px solid #2D2D30", borderRadius: "8px", padding: "24px" }}>
            <h1 style={{ margin: "0 0 12px", color: "#D4A943" }}>Order update</h1>
            <p style={{ margin: "0 0 16px" }}>
              {statusCopy[status] ?? `Your GVSwift order status changed to ${status}.`}
            </p>
            <p style={{ margin: "0 0 12px", color: "#A0A09B" }}>
              Order ID: <span style={{ color: "#D4A943" }}>{orderId}</span>
            </p>
            {trackingReference ? (
              <p style={{ margin: "0 0 20px", color: "#A0A09B" }}>
                Tracking reference: <span style={{ color: "#FAF8F3" }}>{trackingReference}</span>
              </p>
            ) : null}
            <a href={orderUrl} style={{ color: "#1F1500", backgroundColor: "#D4A943", padding: "10px 16px", borderRadius: "6px", textDecoration: "none", fontWeight: 700 }}>
              View order
            </a>
          </section>
        </main>
      </body>
    </html>
  );
}
