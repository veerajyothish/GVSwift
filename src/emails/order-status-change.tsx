import React from "react";
import type { OrderStatus } from "@prisma/client";
import {
  Html, Head, Body, Container, Section,
  Heading, Text, Button, Hr, Row, Column
} from '@react-email/components';

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

const headingFontFamily = "Georgia, 'Times New Roman', serif";

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
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#FDFAF5', fontFamily: 'sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 16px' }}>

          <Section style={{
            backgroundColor: '#6B1E2E',
            borderRadius: '12px', padding: '28px 32px',
            textAlign: 'center', marginBottom: '20px',
          }}>
            <Heading style={{ color: 'white', margin: 0, fontSize: '24px', fontFamily: headingFontFamily, fontStyle: 'italic', fontWeight: 'normal', letterSpacing: '0.01em' }}>
              {meta.title}
            </Heading>
          </Section>

          <Section style={{ backgroundColor: '#F9F8F5', border: '1px solid #E8DDD9', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px' }}>
            <Text style={{ fontSize: '15px', color: '#28251D', margin: '0 0 24px', lineHeight: 1.6 }}>
              {meta.message}
            </Text>

            <Section style={{ backgroundColor: '#F5F0EB', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <Text style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#7a7974', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Order Summary
              </Text>
              <Text style={{ fontSize: '14px', color: '#28251D', margin: '0 0 16px' }}>
                Order ID: <strong style={{ color: '#6B1E2E' }}>{orderId.slice(-8).toUpperCase()}</strong>
              </Text>

              {items.map((item) => (
                <Row key={`${item.name}-${item.quantity}`} style={{ marginBottom: '8px' }}>
                  <Column style={{ width: '70%' }}>
                    <Text style={{ fontSize: '14px', margin: 0, color: '#28251D' }}>{item.name}</Text>
                    <Text style={{ fontSize: '13px', color: '#7a7974', margin: '2px 0 0' }}>Qty: {item.quantity}</Text>
                  </Column>
                  <Column style={{ textAlign: 'right' }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{formatRupees(item.lineTotalPaise)}</Text>
                  </Column>
                </Row>
              ))}

              <Hr style={{ borderColor: '#E8DDD9', margin: '12px 0' }} />

              <Row>
                <Column><Text style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#28251D' }}>Total Paid</Text></Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#6B1E2E' }}>{formatRupees(totalPaise)}</Text>
                </Column>
              </Row>
            </Section>

            {trackingReference && (
              <Section style={{ padding: '16px', border: '1px dashed #6B1E2E', borderRadius: '8px', backgroundColor: '#FAF4F5', marginBottom: '24px' }}>
                <Text style={{ margin: '0 0 4px', fontSize: '13px', color: '#7a7974', textTransform: 'uppercase', fontWeight: 600 }}>
                  Tracking Details
                </Text>
                <Text style={{ margin: 0, fontSize: '14px', color: '#28251D' }}>
                  Tracking Code: <strong>{trackingReference}</strong>
                </Text>
              </Section>
            )}

            <Section style={{ textAlign: 'center', marginTop: '8px' }}>
              <Button href={orderUrl} style={{ backgroundColor: '#6B1E2E', color: '#FDFAF5', padding: '12px 28px', borderRadius: '9999px', textDecoration: 'none', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                View Order Details
              </Button>
            </Section>
          </Section>

          <Text style={{ fontSize: '12px', color: '#7a7974', textAlign: 'center', margin: 0 }}>
            Thank you for choosing GVSwift.
          </Text>
          <Text style={{ fontSize: '12px', color: '#7a7974', textAlign: 'center', margin: '4px 0 0' }}>
            If you have any questions, please contact our support team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

OrderStatusChangeEmail.PreviewProps = {
  orderId: "ORD-12345678",
  status: "SHIPPED",
  orderUrl: "https://gvswift.com/orders/ORD-12345678",
  totalPaise: 1250000,
  items: [
    { name: "Signature Blend Coffee", quantity: 2, lineTotalPaise: 500000 },
    { name: "Ceramic Pour-Over Dripper", quantity: 1, lineTotalPaise: 750000 }
  ],
  trackingReference: "AWB123456789"
} as OrderStatusChangeEmailProps;
