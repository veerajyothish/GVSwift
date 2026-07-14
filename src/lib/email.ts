import { resend } from './resend';

// Dedicated sending addresses — each has a clear purpose
const FROM_ORDERS  = process.env.RESEND_FROM_ORDERS  || 'orders@gvswift.com';   // order confirmations, invoices, shipping
const FROM_NOREPLY = process.env.RESEND_FROM_NOREPLY || 'noreply@gvswift.com';  // welcome, OTP, password reset, automation
const REPLY_TO     = process.env.RESEND_REPLY_TO     || 'support@gvswift.com';  // all replies land in Zoho inbox

export type EmailSender = 'orders' | 'noreply';

export async function sendEmail({
  to,
  subject,
  html,
  text,
  sender = 'noreply',
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  sender?: EmailSender;
}) {
  const from = sender === 'orders'
    ? `GVSwift <${FROM_ORDERS}>`
    : `GVSwift <${FROM_NOREPLY}>`;

  return await resend.emails.send({
    from,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
  });
}
