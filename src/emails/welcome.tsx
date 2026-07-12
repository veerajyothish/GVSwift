import React from 'react';
import {
  Html, Head, Body, Container, Section,
  Heading, Text, Button, Hr,
} from '@react-email/components';

export interface WelcomeEmailProps {
  firstName: string;
  shopUrl: string;
  supportEmail?: string;
}

export function WelcomeEmail({
  firstName,
  shopUrl,
  supportEmail = 'support@gvswift.com',
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#FDFAF5', fontFamily: 'sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 16px' }}>

          {/* Header */}
          <Section style={{
            backgroundColor: '#6B1E2E',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '20px',
          }}>
            <Text style={{
              color: '#F5CBA7', fontSize: '12px', letterSpacing: '0.15em',
              textTransform: 'uppercase', margin: '0 0 8px', fontWeight: 600,
            }}>
              GVSwift
            </Text>
            <Heading style={{
              color: 'white', margin: 0, fontSize: '26px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic', fontWeight: 'normal', letterSpacing: '0.01em',
            }}>
              Welcome aboard ✨
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{
            backgroundColor: '#F9F8F5',
            border: '1px solid #E8DDD9',
            borderRadius: '12px',
            padding: '28px 24px',
            marginBottom: '16px',
          }}>
            <Text style={{ fontSize: '15px', color: '#28251D', margin: '0 0 12px', lineHeight: 1.7 }}>
              Hi <strong>{firstName}</strong>,
            </Text>
            <Text style={{ fontSize: '15px', color: '#28251D', margin: '0 0 16px', lineHeight: 1.7 }}>
              Thanks for joining GVSwift! Your account is ready — start exploring our curated collection
              of products crafted just for you.
            </Text>

            <Hr style={{ borderColor: '#E8DDD9', margin: '20px 0' }} />

            {/* Feature highlights */}
            <Text style={{ fontSize: '13px', fontWeight: 600, color: '#28251D', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
              What you can do
            </Text>

            {[
              { icon: '🛍️', title: 'Shop with ease', desc: 'Browse, add to cart, and checkout in seconds.' },
              { icon: '📦', title: 'Track your orders', desc: 'Follow every order from placement to delivery.' },
              { icon: '🎁', title: 'Earn loyalty points', desc: 'Get rewarded every time you shop with us.' },
            ].map((f) => (
              <div key={f.title} style={{ display: 'flex', marginBottom: '12px', gap: '12px' }}>
                <span style={{ fontSize: '20px', lineHeight: 1, minWidth: '28px' }}>{f.icon}</span>
                <div>
                  <Text style={{ fontSize: '14px', fontWeight: 600, color: '#28251D', margin: '0 0 2px' }}>{f.title}</Text>
                  <Text style={{ fontSize: '13px', color: '#7a7974', margin: 0 }}>{f.desc}</Text>
                </div>
              </div>
            ))}

            <Hr style={{ borderColor: '#E8DDD9', margin: '20px 0' }} />

            {/* CTA */}
            <Section style={{ textAlign: 'center', marginTop: '4px' }}>
              <Button
                href={shopUrl}
                style={{
                  backgroundColor: '#6B1E2E',
                  color: '#FDFAF5',
                  padding: '13px 32px',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Start Shopping
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Text style={{ fontSize: '12px', color: '#7a7974', textAlign: 'center', margin: '8px 0 0', lineHeight: 1.7 }}>
            Questions? We're always here —{' '}
            <a href={`mailto:${supportEmail}`} style={{ color: '#6B1E2E' }}>{supportEmail}</a>
            <br />© 2026 GVSwift. All rights reserved.
          </Text>

        </Container>
      </Body>
    </Html>
  );
}

WelcomeEmail.PreviewProps = {
  firstName: 'Veera',
  shopUrl: 'https://gvswift.com/shop',
  supportEmail: 'support@gvswift.com',
} as WelcomeEmailProps;
