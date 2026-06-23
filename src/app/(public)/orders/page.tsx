/**
 * /orders
 *
 * Customer Order History Page — paginated list of the authenticated user's orders.
 * TICKET-302. Secured by requireUser(); only shows the current user's orders.
 */

import React from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { listUserOrders } from "@/features/orders/service";
import { Navbar } from "@/components/ui/Navbar";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
};

/** Human-readable status labels with semantic color mappings */
const STATUS_CONFIG: Record<string, { label: string; colorVar: string }> = {
  PLACED: { label: "Placed", colorVar: "var(--color-info)" },
  CONFIRMED: { label: "Confirmed", colorVar: "var(--color-info)" },
  SHIPPED: { label: "Shipped", colorVar: "var(--color-accent)" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", colorVar: "var(--color-accent)" },
  DELIVERED: { label: "Delivered", colorVar: "var(--color-success)" },
  CANCELLED: { label: "Cancelled", colorVar: "var(--color-error)" },
  FAILED_DELIVERY: { label: "Failed Delivery", colorVar: "var(--color-warning)" },
  RTO: { label: "Returned to Origin", colorVar: "var(--color-error)" },
  RETURN_REQUESTED: { label: "Return Requested", colorVar: "var(--color-warning)" },
  RETURNED: { label: "Returned", colorVar: "var(--color-text-secondary)" },
};

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const { orders, total, totalPages, page: currentPage } = await listUserOrders(user.id, page, 10);

  return (
    <div className="min-h-screen bg-default">
      <Navbar />

      <main className="container-md">
        <header className="mb-32">
          <h1 className="text-3xl font-semibold text-primary mb-8">
            My Orders
          </h1>
          <p className="text-secondary">
            {total === 0
              ? "You haven't placed any orders yet."
              : `${total} order${total !== 1 ? "s" : ""} total`}
          </p>
        </header>

        {orders.length === 0 ? (
          <div className="orders-empty-state">
            <div className="orders-empty-icon">📦</div>
            <p className="text-secondary mb-16 text-base">
              No orders found. Start shopping to see your orders here.
            </p>
            <Link href="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="orders-list">
              {orders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] ?? {
                  label: order.status,
                  colorVar: "var(--color-text-secondary)",
                };

                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="order-card card card-interactive"
                    id={`order-${order.id}`}
                  >
                    <div className="order-card-thumb relative">
                      {order.firstItemImage ? (
                        <Image
                          src={order.firstItemImage}
                          alt={order.firstItemName}
                          className="w-full h-full object-cover"
                          fill
                          sizes="(max-width: 640px) 56px, 72px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-secondary text-xl">
                          📦
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="order-card-info">
                      <div className="order-card-header">
                        <span className="text-sm text-secondary">
                          {formatDate(order.createdAt)}
                        </span>
                        <span
                          className="order-status-badge"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${cfg.colorVar} 15%, transparent)`,
                            color: cfg.colorVar,
                            borderColor: `color-mix(in srgb, ${cfg.colorVar} 25%, transparent)`,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      <p className="font-medium text-primary mb-4 text-sm">
                        {order.firstItemName}
                        {order.itemCount > 1 && (
                          <span className="text-secondary">
                            {" "}
                            +{order.itemCount - 1} more
                          </span>
                        )}
                      </p>

                      <p className="font-semibold text-accent text-base">
                        {formatPaise(order.totalPaise)}
                      </p>
                    </div>

                    {/* Chevron */}
                    <div className="order-card-chevron" aria-hidden="true">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="orders-pagination" aria-label="Order list pagination">
                {currentPage > 1 ? (
                  <Link
                    href={`/orders?page=${currentPage - 1}`}
                    className="btn btn-secondary"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span />
                )}

                <span className="text-sm text-secondary">
                  Page {currentPage} of {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link
                    href={`/orders?page=${currentPage + 1}`}
                    className="btn btn-secondary"
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
      </main>
    </div>
  );
}
