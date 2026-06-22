import type { OrderStatus } from "@prisma/client";

interface OrderEmailItem {
  name: string;
  quantity: number;
  lineTotalPaise: number;
}

export interface OrderPlacedEmailProps {
  orderId: string;
  status: OrderStatus;
  totalPaise: number;
  items: OrderEmailItem[];
  orderUrl: string;
}

const bodyStyle = {
  margin: 0,
  backgroundColor: "#0B0B0C",
  color: "#FAF8F3",
  fontFamily: "Arial, sans-serif",
};

const containerStyle = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "32px 20px",
};

const cardStyle = {
  backgroundColor: "#1F1F22",
  border: "1px solid #2D2D30",
  borderRadius: "8px",
  padding: "24px",
};

const accentStyle = {
  color: "#D4A943",
};

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

export function OrderPlacedEmail({
  orderId,
  status,
  totalPaise,
  items,
  orderUrl,
}: OrderPlacedEmailProps) {
  return (
    <html>
      <body style={bodyStyle}>
        <main style={containerStyle}>
          <section style={cardStyle}>
            <h1 style={{ margin: "0 0 12px", color: "#D4A943" }}>Order placed</h1>
            <p style={{ margin: "0 0 16px" }}>
              Thanks for shopping with GVSwift. We received your order and it is currently{" "}
              <strong>{status.replaceAll("_", " ")}</strong>.
            </p>
            <p style={{ margin: "0 0 16px", color: "#A0A09B" }}>
              Order ID: <span style={accentStyle}>{orderId}</span>
            </p>
            <ul style={{ paddingLeft: "20px", margin: "0 0 16px" }}>
              {items.map((item) => (
                <li key={`${item.name}-${item.quantity}`} style={{ marginBottom: "8px" }}>
                  {item.name} x {item.quantity} - {formatRupees(item.lineTotalPaise)}
                </li>
              ))}
            </ul>
            <p style={{ margin: "0 0 20px", fontWeight: 700 }}>
              Total: {formatRupees(totalPaise)}
            </p>
            <a href={orderUrl} style={{ color: "#1F1500", backgroundColor: "#D4A943", padding: "10px 16px", borderRadius: "6px", textDecoration: "none", fontWeight: 700 }}>
              View order
            </a>
          </section>
        </main>
      </body>
    </html>
  );
}
