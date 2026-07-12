import { NextRequest, NextResponse } from 'next/server';
import { renderAsync } from '@react-email/render';
import { sendEmail } from '@/lib/email';
import { OrderPlacedEmail } from '@/emails/order-placed';
import { getSiteUrl } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerEmail,
      customerName,
      orderId,
      orderItems,   // { name, quantity, lineTotalPaise }[]
      totalPaise,
      deliveryAddress,
      status = 'PLACED',
    } = body;

    const orderUrl = `${getSiteUrl()}/orders/${orderId}`;

    const html = await renderAsync(
      OrderPlacedEmail({
        orderId,
        customerName,
        status,
        totalPaise,
        items: orderItems,
        orderUrl,
        deliveryAddress,
      })
    );

    const { data, error } = await sendEmail({
      to: customerEmail,
      subject: `Order Confirmed #${orderId} — GVSwift`,
      html,
      sender: 'orders',
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
