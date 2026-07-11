import React from "react";
import type { OrderStatus } from "@prisma/client";
import {
  Html, Head, Body, Container, Section,
  Heading, Text, Button, Hr, Row, Column
} from '@react-email/components';

interface OrderEmailItem {
  name: string;
  quantity: number;
  lineTotalPaise: number;
}

export interface OrderPlacedEmailProps {
  orderId: string;
  status: OrderStatus;
  totalPaise: number;
  items: OrderEmailItem[];
  orderUrl: string;
}

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

export function OrderPlacedEmail({
  orderId,
  status,
  totalPaise,
  items,
  orderUrl,
}: OrderPlacedEmailProps) {
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
            <Heading style={{ color: 'white', margin: 0, fontSize: '24px', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', fontWeight: 'normal' }}>
              Order Placed
            </Heading>
          </Section>

          <Section style={{ backgroundColor: 'white', border: '1px solid #E8DDD9', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px' }}>
            <Text style={{ fontSize: '15px', color: '#1A1A1A', margin: '0 0 16px', lineHeight: 1.6 }}>
              Thanks for shopping with GVSwift. We received your order and it is currently{" "}
              <strong>{status.replaceAll("_", " ")}</strong>.
            </Text>
            
            <Text style={{ fontSize: '14px', color: '#1A1A1A', margin: '0 0 16px' }}>
              Order ID: <strong style={{ color: '#6B1E2E' }}>{orderId}</strong>
            </Text>

            <Section style={{ backgroundColor: '#F5F0EB', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              {items.map((item) => (
                <Row key={`${item.name}-${item.quantity}`} style={{ marginBottom: '8px' }}>
                  <Column style={{ width: '70%' }}>
                    <Text style={{ fontSize: '14px', margin: 0, color: '#1A1A1A' }}>{item.name}</Text>
                    <Text style={{ fontSize: '13px', color: '#6B5B55', margin: '2px 0 0' }}>Qty: {item.quantity}</Text>
                  </Column>
                  <Column style={{ textAlign: 'right' }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{formatRupees(item.lineTotalPaise)}</Text>
                  </Column>
                </Row>
              ))}
              <Hr style={{ borderColor: '#E8DDD9', margin: '12px 0' }} />
              <Row>
                <Column><Text style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1A1A1A' }}>Total</Text></Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#6B1E2E' }}>{formatRupees(totalPaise)}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={{ textAlign: 'center', marginTop: '24px' }}>
              <Button href={orderUrl} style={{ backgroundColor: '#6B1E2E', color: '#FDFAF5', padding: '12px 28px', borderRadius: '9999px', textDecoration: 'none', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                View Order Details
              </Button>
            </Section>
          </Section>

          <Text style={{ fontSize: '12px', color: '#6B5B55', textAlign: 'center', margin: 0 }}>
            GVSwift · Questions? Contact our support team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
