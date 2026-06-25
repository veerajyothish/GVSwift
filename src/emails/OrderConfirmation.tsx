import React from "react";
import {
  Html, Head, Body, Container, Section,
  Heading, Text, Hr, Row, Column
} from '@react-email/components';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Props {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: { line1: string; city: string; state: string; pincode: string };
  paymentMethod: string;
}

export default function OrderConfirmation(p: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f7f6f2', fontFamily: 'sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 16px' }}>

          <Section style={{
            background: 'linear-gradient(135deg, #561922, #3c0610)',
            borderRadius: '12px', padding: '28px 32px',
            textAlign: 'center', marginBottom: '20px',
          }}>
            <Heading style={{ color: 'white', margin: 0, fontSize: '22px' }}>
              ✅ Order Confirmed!
            </Heading>
            <Text style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0', fontSize: '14px' }}>
              Thank you, {p.customerName}. We&apos;ve received your order.
            </Text>
          </Section>

          <Section style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px' }}>
            <Row>
              <Column>
                <Text style={{ fontSize: '12px', color: '#7a7974', margin: 0 }}>Order Number</Text>
                <Text style={{ fontSize: '15px', fontWeight: 700, margin: '2px 0 0', color: '#28251d' }}>#{p.orderNumber}</Text>
              </Column>
              <Column>
                <Text style={{ fontSize: '12px', color: '#7a7974', margin: 0 }}>Date</Text>
                <Text style={{ fontSize: '14px', fontWeight: 600, margin: '2px 0 0', color: '#28251d' }}>{p.orderDate}</Text>
              </Column>
              <Column>
                <Text style={{ fontSize: '12px', color: '#7a7974', margin: 0 }}>Payment</Text>
                <Text style={{ fontSize: '14px', fontWeight: 600, margin: '2px 0 0', color: '#28251d' }}>{p.paymentMethod}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px' }}>
            <Text style={{ fontSize: '12px', fontWeight: 700, color: '#7a7974', margin: '0 0 14px', letterSpacing: '0.06em' }}>
              ITEMS ORDERED
            </Text>
            {p.items.map((item, i) => (
              <Row key={i} style={{ marginBottom: '10px' }}>
                <Column style={{ width: '70%' }}>
                  <Text style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#28251d' }}>{item.name}</Text>
                  <Text style={{ fontSize: '13px', color: '#7a7974', margin: '2px 0 0' }}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                </Column>
              </Row>
            ))}
            <Hr style={{ borderColor: '#dcd9d5', margin: '16px 0' }} />
            <Row style={{ marginBottom: '6px' }}>
              <Column><Text style={{ fontSize: '13px', color: '#7a7974', margin: 0 }}>Subtotal</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ fontSize: '13px', margin: 0 }}>₹{p.subtotal.toFixed(2)}</Text></Column>
            </Row>
            <Row style={{ marginBottom: '6px' }}>
              <Column><Text style={{ fontSize: '13px', color: '#7a7974', margin: 0 }}>Shipping</Text></Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: '13px', margin: 0 }}>{p.shipping === 0 ? 'Free' : `₹${p.shipping.toFixed(2)}`}</Text>
              </Column>
            </Row>
            <Row>
              <Column><Text style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0 0', color: '#28251d' }}>Total</Text></Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0 0', color: '#561922' }}>₹{p.total.toFixed(2)}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}>
            <Text style={{ fontSize: '12px', fontWeight: 700, color: '#7a7974', margin: '0 0 8px', letterSpacing: '0.06em' }}>SHIPPING TO</Text>
            <Text style={{ fontSize: '14px', color: '#28251d', margin: 0, lineHeight: 1.7 }}>
              {p.shippingAddress.line1}<br />
              {p.shippingAddress.city}, {p.shippingAddress.state} — {p.shippingAddress.pincode}
            </Text>
          </Section>

          <Text style={{ fontSize: '12px', color: '#bab9b4', textAlign: 'center', margin: 0 }}>
            GVSwift · Questions? Visit{' '}
            <a href="https://gvswift.vercel.app" style={{ color: '#561922' }}>gvswift.vercel.app</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

