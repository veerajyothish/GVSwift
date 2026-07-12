export function orderConfirmationEmail({
  customerName,
  orderId,
  orderItems,
  totalAmount,
  deliveryAddress,
}: {
  customerName: string;
  orderId: string;
  orderItems: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  deliveryAddress: string;
}) {
  const itemRows = orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${item.name}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">₹${item.price.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">GVSwift</h1>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Order Confirmation</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Hello,</p>
              <h2 style="margin:0 0 24px;color:#0f172a;font-size:22px;font-weight:600;">Thanks for your order, ${customerName}! 🎉</h2>
              <p style="margin:0 0 32px;color:#475569;font-size:15px;line-height:1.6;">
                Your order has been confirmed and is being processed. 
                We'll notify you once it's on its way.
              </p>

              <!-- Order ID -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:32px;">
                <p style="margin:0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Order ID</p>
                <p style="margin:4px 0 0;color:#0f172a;font-size:18px;font-weight:600;">#${orderId}</p>
              </div>

              <!-- Items Table -->
              <h3 style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:600;">Order Summary</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <th style="text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Item</th>
                  <th style="text-align:center;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Qty</th>
                  <th style="text-align:right;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Price</th>
                </tr>
                ${itemRows}
              </table>

              <!-- Total -->
              <div style="text-align:right;padding:16px 0;border-top:2px solid #0f172a;">
                <span style="color:#0f172a;font-size:18px;font-weight:700;">Total: ₹${totalAmount.toFixed(2)}</span>
              </div>

              <!-- Delivery Address -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-top:24px;">
                <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Delivery Address</p>
                <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;">${deliveryAddress}</p>
              </div>

              <!-- Support Note -->
              <p style="margin:32px 0 0;color:#475569;font-size:14px;line-height:1.6;">
                Have a question about your order? Just reply to this email or reach us at 
                <a href="mailto:support@gvswift.com" style="color:#0f172a;font-weight:600;">support@gvswift.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © 2026 GVSwift. All rights reserved.<br>
                This is an automated email. Please do not reply directly — 
                contact us at <a href="mailto:support@gvswift.com" style="color:#64748b;">support@gvswift.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html };
}
