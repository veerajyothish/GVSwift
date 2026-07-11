/**
 * /account/orders — Order History
 * PDF p.12: sidebar left, main right. Order cards show ORDER NUMBER / DATE PLACED /
 * TOTAL AMOUNT / status badge pill / product thumb + name / TRACK ORDER button.
 */
import React from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = { title: "My Orders | GVSwift" };

const STATUS_CONFIG: Record<
  string,
  { label: string; colorVar: string; bgVar: string }
> = {
  PLACED:            { label: "Placed",             colorVar: "#fff", bgVar: "var(--color-warning)" },
  CONFIRMED:         { label: "Confirmed",           colorVar: "#fff", bgVar: "var(--color-warning)" },
  SHIPPED:           { label: "Shipped",             colorVar: "#fff", bgVar: "var(--color-accent)" },
  OUT_FOR_DELIVERY:  { label: "Out for Delivery",    colorVar: "#fff", bgVar: "var(--color-accent)" },
  DELIVERED:         { label: "Delivered",           colorVar: "#fff", bgVar: "var(--color-success)" },
  CANCELLED:         { label: "Cancelled",           colorVar: "#fff", bgVar: "var(--color-error)" },
  FAILED_DELIVERY:   { label: "Failed Delivery",     colorVar: "#fff", bgVar: "var(--color-error)" },
  RTO:               { label: "Returned to Origin",  colorVar: "#fff", bgVar: "var(--color-error)" },
  RETURN_REQUESTED:  { label: "Return Requested",    colorVar: "#fff", bgVar: "var(--color-warning)" },
  RETURNED:          { label: "Returned",            colorVar: "#fff", bgVar: "var(--color-text-secondary)" },
};

function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AccountOrdersPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const PAGE_SIZE = 10;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, status: true, totalPaise: true, createdAt: true,
        items: {
          take: 1,
          select: {
            quantity: true,
            product: {
              select: {
                name: true,
                images: { where: { isPrimary: true }, take: 1, select: { url: true } },
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where: { userId: user.id } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <header
        style={{
          paddingBottom: "20px",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "8px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(28px, 4vw, 36px)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--color-accent)",
            marginBottom: "8px",
          }}
        >
          Order History
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
          {total === 0
            ? "You haven't placed any orders yet."
            : `${total} order${total !== 1 ? "s" : ""} total.`}
        </p>
      </header>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "64px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span style={{ fontSize: "56px", opacity: 0.4 }}>📦</span>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "22px",
              fontStyle: "italic",
              color: "var(--color-text-primary)",
            }}
          >
            No orders yet
          </p>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", maxWidth: "320px" }}>
            Start browsing our premium collections.
          </p>
          <Link
            href="/products"
            className="btn btn-primary btn-premium"
            style={{ marginTop: "8px" }}
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          {/* Order cards — PDF p.12 layout */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? {
                label: order.status,
                colorVar: "var(--color-text-secondary)",
                bgVar: "var(--color-surface)",
              };
              const displayId = `#GVS-${order.id.slice(0, 8).toUpperCase()}`;
              const firstItem = order.items[0];
              const itemName = firstItem?.product?.name ?? "Unknown Product";
              const itemImage = firstItem?.product?.images?.[0]?.url ?? null;

              return (
                <div
                  key={order.id}
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {/* Top row: meta + status badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "12px",
                      paddingBottom: "16px",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "28px",
                      }}
                    >
                      {[
                        { label: "Order Number", value: displayId, mono: true },
                        { label: "Date Placed", value: formatDate(order.createdAt) },
                        { label: "Total Amount", value: formatPaise(order.totalPaise) },
                      ].map(({ label, value, mono }) => (
                        <div key={label}>
                          <span
                            style={{
                              display: "block",
                              fontSize: "11px",
                              fontWeight: 600,
                              letterSpacing: "0.07em",
                              textTransform: "uppercase",
                              color: "var(--color-text-secondary)",
                              marginBottom: "4px",
                            }}
                          >
                            {label}
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "var(--color-text-primary)",
                              fontFamily: mono ? "monospace" : "inherit",
                            }}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Status badge pill — PDF p.12 */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "5px 14px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: cfg.colorVar,
                        background: cfg.bgVar,
                        border: `1px solid ${cfg.colorVar}`,
                        flexShrink: 0,
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  {/* Product preview + Track button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "var(--radius-md)",
                          overflow: "hidden",
                          flexShrink: 0,
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          position: "relative",
                        }}
                      >
                        {itemImage ? (
                          <Image
                            src={itemImage}
                            alt={itemName}
                            fill
                            sizes="64px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "24px",
                            }}
                          >
                            📦
                          </div>
                        )}
                      </div>

                      <div>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: 500,
                            color: "var(--color-text-primary)",
                            marginBottom: "2px",
                          }}
                        >
                          {itemName}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                          Qty: {firstItem?.quantity ?? 1}
                        </p>
                      </div>
                    </div>

                    {/* Track Order button — PDF p.12 */}
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="btn btn-secondary"
                      style={{ minWidth: "140px", justifyContent: "center" }}
                    >
                      Track Order
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "20px",
                borderTop: "1px solid var(--color-border)",
                marginTop: "8px",
              }}
            >
              {page > 1 ? (
                <Link
                  href={`/account/orders?page=${page - 1}`}
                  className="btn btn-secondary btn-sm"
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/account/orders?page=${page + 1}`}
                  className="btn btn-secondary btn-sm"
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}