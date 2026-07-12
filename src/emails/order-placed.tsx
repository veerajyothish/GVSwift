import React from 'react';
import type { OrderStatus } from '@prisma/client';
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
  customerName: string;
  status: OrderStatus;
  totalPaise: number;
  items: OrderEmailItem[];
  orderUrl: string;
  deliveryAddress?: string;
}

function formatRupees(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

export function OrderPlacedEmail({
  orderId,
  customerName,
  status,
  totalPaise,
  items,
  orderUrl,
  deliveryAddress,
}: OrderPlacedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#FDFAF5', fontFamily: 'sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 16px' }}>

          {/* Header */}
          <Section style={{
            backgroundColor: '#6B1E2E',
            borderRadius: '12px',
            padding: '28px 32px',
            textAlign: 'center',
            marginBottom: '20px',
          }}>
            <Text style={{ color: '#F5CBA7', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px', fontWeight: 600 }}>
              GVSwift
            </Text>
            <Heading style={{
              color: 'white', margin: 0, fontSize: '24px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic', fontWeight: 'normal', letterSpacing: '0.01em',
            }}>
              Order Confirmed 🎉
            </Heading>
          </Section>

          {/* Greeting */}
          <Section style={{ backgroundColor: '#F9F8F5', border: '1px solid #E8DDD9', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px' }}>
            <Text style={{ fontSize: '15px', color: '#28251D', margin: '0 0 4px', lineHeight: 1.6 }}>
              Hi <strong>{customerName}</strong>,
            </Text>
            <Text style={{ fontSize: '15px', color: '#28251D', margin: '0 0 16px', lineHeight: 1.6 }}>
              Thanks for shopping with GVSwift! Your order has been confirmed and is currently{' '}
              <strong>{status.replaceAll('_', ' ')}</strong>.
            </Text>

            {/* Order ID */}
            <div style={{ backgroundColor: '#F5F0EB', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
              <Text style={{ fontSize: '12px', color: '#7a7974', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Order ID</Text>
              <Text style={{ fontSize: '16px', fontWeight: 700, color: '#6B1E2E', margin: 0 }}>#{orderId}</Text>
            </div>

            {/* Items */}
            <Text style={{ fontSize: '13px', fontWeight: 600, color: '#28251D', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Order Summary</Text>
            <Section style={{ backgroundColor: '#F5F0EB', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              {items.map((item) => (
                <Row key={`${item.name}-${item.quantity}`} style={{ marginBottom: '8px' }}>
                  <Column style={{ width: '70%' }}>
                    <Text style={{ fontSize: '14px', margin: 0, color: '#28251D' }}>{item.name}</Text>
                    <Text style={{ fontSize: '13px', color: '#7a7974', margin: '2px 0 0' }}>Qty: {item.quantity}</Text>
                  </Column>
                  <Column style={{ textAlign: 'right' }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#28251D' }}>{formatRupees(item.lineTotalPaise)}</Text>
                  </Column>
                </Row>
              ))}
              <Hr style={{ borderColor: '#E8DDD9', margin: '12px 0' }} />
              <Row>
                <Column><Text style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#28251D' }}>Total</Text></Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#6B1E2E' }}>{formatRupees(totalPaise)}</Text>
                </Column>
              </Row>
            </Section>

            {/* Delivery Address */}
            {deliveryAddress && (
              <Section style={{ marginBottom: '20px' }}>
                <Text style={{ fontSize: '13px', fontWeight: 600, color: '#28251D', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Delivery To</Text>
                <div style={{ backgroundColor: '#F5F0EB', borderRadius: '8px', padding: '12px 16px' }}>
                  <Text style={{ fontSize: '14px', color: '#28251D', margin: 0, lineHeight: 1.6 }}>{deliveryAddress}</Text>
                </div>
              </Section>
            )}

            {/* CTA */}
            <Section style={{ textAlign: 'center', marginTop: '8px' }}>
              <Button
                href={orderUrl}
                style={{
                  backgroundColor: '#6B1E2E', color: '#FDFAF5',
                  padding: '12px 28px', borderRadius: '9999px',
                  textDecoration: 'none', fontWeight: 600,
                  fontSize: '13px', textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                View Order Details
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Text style={{ fontSize: '12px', color: '#7a7974', textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
            Questions about your order? Reply to this email or contact{' '}
            <a href="mailto:support@gvswift.com" style={{ color: '#6B1E2E' }}>support@gvswift.com</a>
            <br />© 2026 GVSwift. All rights reserved.
          </Text>

        </Container>
      </Body>
    </Html>
  );
}

OrderPlacedEmail.PreviewProps = {
  orderId: 'ORD-12345678',
  customerName: 'Veera',
  status: 'PLACED',
  totalPaise: 1250000,
  items: [
    { name: 'Signature Blend Coffee', quantity: 2, lineTotalPaise: 500000 },
    { name: 'Ceramic Pour-Over Dripper', quantity: 1, lineTotalPaise: 750000 },
  ],
  orderUrl: 'https://gvswift.com/orders/ORD-12345678',
  deliveryAddress: '42, MG Road, Bengaluru, Karnataka 560001',
} as OrderPlacedEmailProps;
