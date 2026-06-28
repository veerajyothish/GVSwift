/* eslint-disable @next/next/no-head-element */
import type { OrderStatus } from "@prisma/client";

export interface OrderStatusChangeEmailProps {
  orderId: string;
  status: OrderStatus;
  orderUrl: string;
  totalPaise: number;
  items: {
    name: string;
    quantity: number;
    lineTotalPaise: number;
  }[];
  trackingReference?: string | null;
}

const statusMeta: Record<OrderStatus, { title: string; message: string }> = {
  PLACED: {
    title: "Order Placed",
    message: "Thank you for your order! We have received it and are preparing to process it.",
  },
  CONFIRMED: {
    title: "Order Confirmed & Processing",
    message: "Great news! Your order has been confirmed and is now being processed. We are preparing it for shipment.",
  },
  SHIPPED: {
    title: "Order Shipped",
    message: "Exciting news! Your order has been shipped and is on its way to you.",
  },
  OUT_FOR_DELIVERY: {
    title: "Out for Delivery",
    message: "Your order is out for delivery today. Please ensure someone is available to receive it.",
  },
  DELIVERED: {
    title: "Order Delivered",
    message: "Your order has been successfully delivered. We hope you love your new GVSwift products!",
  },
  CANCELLED: {
    title: "Order Cancelled",
    message: "Your order has been cancelled. If you did not request this or believe it is an error, please contact our support team.",
  },
  FAILED_DELIVERY: {
    title: "Delivery Attempt Failed",
    message: "We tried to deliver your order today but were unsuccessful. We will attempt delivery again shortly.",
  },
  RTO: {
    title: "Returned to Origin",
    message: "Your order could not be delivered and has been returned to our warehouse.",
  },
  RETURN_REQUESTED: {
    title: "Return Requested",
    message: "We have received your return request and are currently reviewing it.",
  },
  RETURNED: {
    title: "Return Complete",
    message: "Your return has been processed successfully. Thank you for your patience.",
  },
};

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

export function OrderStatusChangeEmail({
  orderId,
  status,
  orderUrl,
  totalPaise,
  items,
  trackingReference,
}: OrderStatusChangeEmailProps) {
  const meta = statusMeta[status] || {
    title: "Order Update",
    message: `Your GVSwift order status has changed to ${status.replaceAll("_", " ")}.`,
  };

  return (
    <html>
      <head>
        <title>{meta.title}</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#FDFAF5", color: "#1A1A1A", fontFamily: "'Inter', Arial, sans-serif" }}>
        <main style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px" }}>
          {/* Header section with brand logo */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "bold", fontStyle: "italic", color: "#6B1E2E", letterSpacing: "0.06em" }}>
              GVSwift
            </span>
          </div>

          {/* Main Card */}
          <section style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8DDD9", borderRadius: "12px", padding: "32px", boxShadow: "0 4px 12px rgba(107, 30, 46, 0.04)" }}>
            <h1 style={{ margin: "0 0 16px", fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: 400, fontStyle: "italic", color: "#6B1E2E", borderBottom: "1px solid #E8DDD9", paddingBottom: "16px" }}>
              {meta.title}
            </h1>
            
            <p style={{ margin: "0 0 24px", fontSize: "15px", lineHeight: 1.6, color: "#4A4A4A" }}>
              {meta.message}
            </p>

            {/* Order Details */}
            <div style={{ backgroundColor: "#F5F0EB", borderRadius: "8px", padding: "20px", marginBottom: "24px" }}>
              <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 600, color: "#6B5B55", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Order Summary
              </p>
              <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#1A1A1A" }}>
                Order ID: <strong style={{ color: "#6B1E2E" }}>{orderId.slice(-8).toUpperCase()}</strong>
              </p>
              
              <ul style={{ paddingLeft: "20px", margin: "0 0 16px", fontSize: "14px", color: "#4A4A4A" }}>
                {items.map((item) => (
                  <li key={`${item.name}-${item.quantity}`} style={{ marginBottom: "8px" }}>
                    {item.name} <span style={{ color: "#6B5B55" }}>x {item.quantity}</span> — {formatRupees(item.lineTotalPaise)}
                  </li>
                ))}
              </ul>
              
              <p style={{ margin: "12px 0 0", fontSize: "16px", fontWeight: 700, color: "#6B1E2E", borderTop: "1px solid #E8DDD9", paddingTop: "12px" }}>
                Total Paid: {formatRupees(totalPaise)}
              </p>
            </div>

            {/* Tracking Reference (if shipped) */}
            {trackingReference && (
              <div style={{ margin: "0 0 24px", padding: "16px", border: "1px dashed #6B1E2E", borderRadius: "8px", backgroundColor: "rgba(107, 30, 46, 0.02)" }}>
                <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#6B5B55", textTransform: "uppercase", fontWeight: 600 }}>
                  Tracking Details
                </p>
                <p style={{ margin: 0, fontSize: "14px", color: "#1A1A1A" }}>
                  Tracking Code: <strong>{trackingReference}</strong>
                </p>
              </div>
            )}

            {/* View Order Link */}
            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <a href={orderUrl} style={{ display: "inline-block", backgroundColor: "#6B1E2E", color: "#FDFAF5", padding: "12px 28px", borderRadius: "9999px", textDecoration: "none", fontWeight: 600, fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                View Order Details
              </a>
            </div>
          </section>

          {/* Footer section */}
          <div style={{ textAlign: "center", marginTop: "32px", fontSize: "12px", color: "#6B5B55" }}>
            <p style={{ margin: "0 0 8px" }}>Thank you for choosing GVSwift.</p>
            <p style={{ margin: 0 }}>If you have any questions, please contact our support team.</p>
          </div>
        </main>
      </body>
    </html>
  );
}
