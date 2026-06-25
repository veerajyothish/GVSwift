import React from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
};

const STATUS_CONFIG: Record<string, { label: string; colorVar: string; icon: string }> = {
  PLACED: { label: "Placed", colorVar: "var(--color-info)", icon: "receipt" },
  CONFIRMED: { label: "Confirmed", colorVar: "var(--color-info)", icon: "check_circle" },
  SHIPPED: { label: "Shipped", colorVar: "var(--color-accent)", icon: "local_shipping" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", colorVar: "var(--color-accent)", icon: "local_shipping" },
  DELIVERED: { label: "Delivered", colorVar: "var(--color-success)", icon: "done_all" },
  CANCELLED: { label: "Cancelled", colorVar: "var(--color-error)", icon: "cancel" },
  FAILED_DELIVERY: { label: "Failed Delivery", colorVar: "var(--color-warning)", icon: "warning" },
  RTO: { label: "Returned to Origin", colorVar: "var(--color-error)", icon: "assignment_return" },
  RETURN_REQUESTED: { label: "Return Requested", colorVar: "var(--color-warning)", icon: "assignment_return" },
  RETURNED: { label: "Returned", colorVar: "var(--color-text-secondary)", icon: "assignment_returned" },
};

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
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
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        status: true,
        totalPaise: true,
        createdAt: true,
        items: {
          take: 1,
          select: {
            quantity: true,
            product: {
              select: {
                name: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true }
                }
              }
            }
          }
        }
      },
    }),
    prisma.order.count({ where: { userId: user.id } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-12 border-b border-color-border pb-6" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <h1 className="text-3xl font-semibold text-primary mb-4">
          Order History
        </h1>
        <p className="text-secondary text-sm">
          {total === 0
            ? "You haven't placed any orders yet."
            : `Manage and track your ${total} order${total !== 1 ? "s" : ""} total.`}
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="card p-8 flex flex-col items-center text-center gap-4">
          <span style={{ fontSize: "48px" }}>📦</span>
          <h2 className="text-xl font-semibold text-primary">No orders found</h2>
          <p className="text-sm text-secondary max-w-md">
            Looks like you haven&apos;t placed any orders yet. Start browsing our premium collections.
          </p>
          <Link href="/products" className="btn btn-primary mt-4" style={{ borderRadius: "50px" }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? {
              label: order.status,
              colorVar: "var(--color-text-secondary)",
              icon: "package",
            };

            const displayOrderId = `#GVS-${order.id.slice(0, 8).toUpperCase()}`;
            const firstItem = order.items[0];
            const firstItemName = firstItem?.product?.name ?? "Unknown Product";
            const firstItemImage = firstItem?.product?.images?.[0]?.url ?? null;

            return (
              <div
                key={order.id}
                className="card hover-lift p-6 flex flex-col gap-6"
                id={`order-${order.id}`}
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {/* Card Header (Meta Details) */}
                <div
                  className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-color-border"
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-secondary font-semibold uppercase tracking-wider">
                        Order Number
                      </span>
                      <span className="text-sm font-semibold text-primary font-mono">
                        {displayOrderId}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-secondary font-semibold uppercase tracking-wider">
                        Date Placed
                      </span>
                      <span className="text-sm font-medium text-primary">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-secondary font-semibold uppercase tracking-wider">
                        Total Amount
                      </span>
                      <span className="text-sm font-bold text-accent">
                        {formatPaise(order.totalPaise)}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full self-start sm:self-auto"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${cfg.colorVar} 10%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${cfg.colorVar} 20%, transparent)`,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "18px",
                        color: cfg.colorVar,
                      }}
                    >
                      {cfg.icon}
                    </span>
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: cfg.colorVar }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div
                      className="relative w-20 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-default"
                      style={{ border: "1px solid var(--color-border)" }}
                    >
                      {firstItemImage ? (
                        <Image
                          src={firstItemImage}
                          alt={firstItemName}
                          className="w-full h-full object-cover"
                          fill
                          sizes="(max-width: 640px) 80px, 80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-secondary text-xl">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold text-primary">
                        {firstItemName}
                      </h3>
                      <p className="text-xs text-secondary">
                        Quantity: {firstItem?.quantity ?? 1}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="btn btn-secondary btn-sm w-full sm:w-auto text-center"
                    style={{
                      minHeight: "38px",
                      padding: "8px 24px",
                      borderRadius: "50px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-between mt-8 pt-6"
              style={{ borderTop: "1px solid var(--color-border)" }}
              aria-label="Order list pagination"
            >
              {page > 1 ? (
                <Link
                  href={`/account/orders?page=${page - 1}`}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: "50px", padding: "6px 16px" }}
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}

              <span className="text-xs text-secondary font-medium">
                Page {page} of {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={`/account/orders?page=${page + 1}`}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: "50px", padding: "6px 16px" }}
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
