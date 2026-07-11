import React from "react";
import {
  Html, Head, Body, Container, Section,
  Heading, Text, Button
} from '@react-email/components';

export interface SupportReplyEmailProps {
  ticketId: string;
  subject: string;
  replyPreview: string;
  ticketUrl: string;
}

export function SupportReplyEmail({
  ticketId,
  subject,
  replyPreview,
  ticketUrl,
}: SupportReplyEmailProps) {
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
              New Support Reply
            </Heading>
          </Section>

          <Section style={{ backgroundColor: 'white', border: '1px solid #E8DDD9', borderRadius: '12px', padding: '24px 24px', marginBottom: '16px' }}>
            <Text style={{ fontSize: '15px', color: '#1A1A1A', margin: '0 0 16px', lineHeight: 1.6 }}>
              We've reviewed your request and have an update regarding: <strong style={{ color: '#6B1E2E' }}>{subject}</strong>
            </Text>
            
            <Section style={{ padding: '16px 20px', borderLeft: '4px solid #6B1E2E', backgroundColor: '#F5F0EB', borderRadius: '0 8px 8px 0', marginBottom: '24px' }}>
              <Text style={{ margin: 0, fontSize: '14px', color: '#1A1A1A', lineHeight: 1.6 }}>
                &quot;{replyPreview}&quot;
              </Text>
            </Section>
            
            <Text style={{ fontSize: '13px', color: '#6B5B55', margin: '0 0 24px', textAlign: 'center' }}>
              Reference ID: <strong>{ticketId}</strong>
            </Text>
            
            <Section style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button href={ticketUrl} style={{ backgroundColor: '#6B1E2E', color: '#FDFAF5', padding: '12px 28px', borderRadius: '9999px', textDecoration: 'none', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                View your ticket
              </Button>
            </Section>
          </Section>

          <Text style={{ fontSize: '12px', color: '#6B5B55', textAlign: 'center', margin: 0 }}>
            GVSwift · Always here to help
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
