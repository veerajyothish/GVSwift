import { Resend } from 'resend';
import { render } from '@react-email/render';
import OrderConfirmation from '@/emails/OrderConfirmation';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(params: {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: { line1: string; city: string; state: string; pincode: string };
  paymentMethod: string;
}) {
  const html = await render(OrderConfirmation(params));
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
    to: params.toEmail,
    subject: `Order Confirmed — #${params.orderNumber} | GVSwift`,
    html,
  });
}
