import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { orderConfirmationEmail } from '@/emails/order-confirmation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerEmail, customerName, orderId, orderItems, totalAmount, deliveryAddress } = body;

    const { html } = orderConfirmationEmail({
      customerName,
      orderId,
      orderItems,
      totalAmount,
      deliveryAddress,
    });

    const { data, error } = await sendEmail({
      to: customerEmail,
      subject: `Order Confirmed #${orderId} — GVSwift`,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Email route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
