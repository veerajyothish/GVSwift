import { resend } from './resend';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@gvswift.com';
const REPLY_TO = process.env.RESEND_REPLY_TO || 'support@gvswift.com';

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  return await resend.emails.send({
    from: `GVSwift <${FROM_EMAIL}>`,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
  });
}
