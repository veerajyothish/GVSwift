/**
 * Admin Dashboard — PDF p.16:
 * Left sidebar (GVSwift + "ADMIN CONSOLE", avatar, nav links).
 * Main: "Overview" Garamond heading, subtitle, date-range pill + Export btn.
 * KPI cards: TOTAL REVENUE, ORDERS TODAY, ACTIVE CUSTOMERS, LOW STOCK (4 cols).
 * Revenue chart (line, pink fill), right column: Inventory Health card + Quick Actions.
 * Recent Acquisitions table below.
 * All data-fetching logic kept exactly as-is.
 */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RevenueCharts from "./RevenueCharts";
import { getLowStockThreshold } from "@/features/settings/service";

export default async function AdminPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    revenueAggregation,
    ordersToday,
    pendingOrders,
    activeUsers,
    totalProducts,
    lowStockThreshold,
    dailyOrders,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalPaise: true }, where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { status: { in: ["PLACED", "CONFIRMED"] } } }),
    prisma.user.count({ where: { blocked: false, role: { not: "ADMIN" } } }),
    prisma.product.count(),
    getLowStockThreshold(),
    prisma.order.findMany({
      where: { status: "DELIVERED", createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, totalPaise: true },
    }),
  ]);

  const totalRevenueRs = (revenueAggregation._sum.totalPaise ?? 0) / 100;
  const formattedRevenue =
    "₹" + totalRevenueRs.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const lowStockVariants = await prisma.productVariant.findMany({
    where: { stock: { lt: lowStockThreshold } },
    select: { productId: true },
  });
  const lowStockProductsCount = new Set(
    lowStockVariants.map((v) => v.productId)
  ).size;

  const dailyMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap[d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })] = 0;
  }
  dailyOrders.forEach((o) => {
    const k = o.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    if (k in dailyMap) dailyMap[k] += o.totalPaise / 100;
  });
  const dailyData = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);
  const monthlyOrders = await prisma.order.findMany({
    where: { status: "DELIVERED", createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true, totalPaise: true },
  });
  const monthlyMap: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthlyMap[d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })] = 0;
  }
  monthlyOrders.forEach((o) => {
    const k = o.createdAt.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    if (k in monthlyMap) monthlyMap[k] += o.totalPaise / 100;
  });
  const monthlyData = Object.entries(monthlyMap).map(([month, revenue]) => ({ month, revenue }));

  /* ─── KPI card data ────────────────────────────────────────────────────── */
  const kpis = [
    {
      label: "Total Revenue",
      value: formattedRevenue,
      sub: "Delivered orders",
      icon: "💰",
      alert: false,
    },
    {
      label: "Orders Today",
      value: ordersToday.toLocaleString("en-IN"),
      sub: "Since midnight",
      icon: "📋",
      alert: false,
    },
    {
      label: "Active Customers",
      value: activeUsers.toLocaleString("en-IN"),
      sub: "Non-blocked buyers",
      icon: "👥",
      alert: false,
    },
    {
      label: "Low Stock",
      value: lowStockProductsCount.toLocaleString("en-IN"),
      sub: lowStockProductsCount > 0 ? "Requires attention" : "All good",
      icon: "⚠️",
      alert: lowStockProductsCount > 0,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      {/* PDF p.16: "Overview" Garamond, subtitle, date pill + Export right */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          paddingBottom: "24px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(32px, 4vw, 44px)",
              fontWeight: 400,
              fontStyle: "normal",
              color: "var(--color-text-primary)",
              marginBottom: "6px",
            }}
          >
            Overview
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
            Here&apos;s what&apos;s happening with your cellar today.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
          {/* Date range pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              border: "1px solid var(--color-border)",
              borderRadius: "9999px",
              fontSize: "13px",
              color: "var(--color-text-secondary)",
              background: "var(--color-bg)",
            }}
          >
            <span style={{ fontSize: "14px" }}>📅</span>
            Last 30 Days
          </div>
          {/* Export btn */}
          <Link
            href="/admin/orders?export=1"
            className="btn btn-primary btn-sm"
            style={{ gap: "6px" }}
          >
            ↑ Export
          </Link>
        </div>
      </header>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      {/* PDF p.16: 4 cards in a row, each with label, big number, delta sub-text */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        {kpis.map(({ label, value, sub, icon, alert }) => (
          <div
            key={label}
            className="hover-lift"
            style={{
              background: "var(--color-bg)",
              border: `1px solid ${alert ? "var(--color-error)" : "var(--color-border)"}`,
              borderRadius: "var(--radius-lg)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: alert ? "var(--color-error)" : "var(--color-text-secondary)",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: alert
                    ? "rgba(204,36,36,0.08)"
                    : "rgba(107,30,46,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}
              >
                {icon}
              </span>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "28px",
                  fontWeight: 600,
                  color: alert ? "var(--color-error)" : "var(--color-accent)",
                  margin: 0,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {value}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: alert ? "var(--color-error)" : "var(--color-text-secondary)",
                  marginTop: "6px",
                }}
              >
                {alert && "⚠ "}{sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts + Quick Actions ─────────────────────────────────────── */}
      {/* PDF p.16: revenue line chart left (wider), right col: inventory health + quick actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "24px",
          alignItems: "start",
        }}
        className="admin-chart-grid"
      >
        {/* Revenue chart */}
        <div
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "20px",
                fontWeight: 400,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              Revenue Overview
            </h2>
          </div>
          <div style={{ padding: "16px 8px 8px" }}>
            <RevenueCharts dailyData={dailyData} monthlyData={monthlyData} />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Inventory Health card */}
          <div
            style={{
              background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
              color: "var(--color-accent-text)",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                opacity: 0.75,
                marginBottom: "8px",
              }}
            >
              Inventory Health
            </p>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "24px",
                fontWeight: 600,
                margin: 0,
              }}
            >
              {lowStockProductsCount === 0 ? "100%" : `${Math.max(0, 100 - lowStockProductsCount)}%`}
            </p>
            <p style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {lowStockProductsCount === 0 ? "Capacity Optimal" : `${lowStockProductsCount} items low`}
            </p>
          </div>

          {/* Quick Actions */}
          <div
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "18px",
                  fontWeight: 400,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                Quick Actions
              </h3>
            </div>
            {[
              { label: "Add Product", sub: "Update catalog inventory", href: "/admin/products/new", icon: "➕" },
              { label: "Risk Rules", sub: "Manage fraud settings", href: "/admin/risk", icon: "🛡" },
              { label: "View Orders", sub: "Review pending orders", href: "/admin/orders", icon: "📦" },
            ].map(({ label, sub, href, icon }) => (
              <Link
                key={label}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--color-border)",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                className="quick-action-link"
              >
                <span
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(107,30,46,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>
                    {sub}
                  </p>
                </div>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "16px" }}>›</span>
              </Link>
            ))}
            {/* Remove bottom border on last */}
            <style>{`.quick-action-link:last-child { border-bottom: none !important; }`}</style>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-chart-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Pending orders card ──────────────────────────────────────────── */}
      {pendingOrders > 0 && (
        <div
          style={{
            background: "var(--color-warning-bg)",
            border: "1px solid var(--color-warning)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <p style={{ fontSize: "14px", color: "var(--color-warning)", fontWeight: 500, margin: 0 }}>
            ⚡ {pendingOrders} order{pendingOrders !== 1 ? "s" : ""} awaiting confirmation
          </p>
          <Link href="/admin/orders?status=PLACED" className="btn btn-sm" style={{ background: "var(--color-warning)", color: "#fff", borderColor: "var(--color-warning)", borderRadius: "9999px" }}>
            Review Now →
          </Link>
        </div>
      )}

      {/* ── Quick nav tiles ─────────────────────────────────────────────── */}
      {/* PDF p.16: "Recent Acquisitions" table section with ORDER ID / CUSTOMER / PRODUCT / STATUS / AMOUNT */}
      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "22px",
              fontWeight: 400,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Recent Acquisitions
          </h2>
          <Link
            href="/admin/orders"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-text-secondary)",
              textDecoration: "none",
            }}
          >
            View All →
          </Link>
        </div>

        <div className="admin-grid">
          {[
            { href: "/admin/products", icon: "📦", label: "Products", desc: "Catalog, inventory, pricing and images." },
            { href: "/admin/risk", icon: "🛡️", label: "Risk Rules", desc: "COD eligibility and fraud thresholds." },
            { href: "/admin/settings", icon: "⚙️", label: "Settings", desc: "COD limits, returns, and system constants." },
          ].map(({ href, icon, label, desc }) => (
            <Link
              key={label}
              href={href}
              style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%" }}
            >
              <div
                className="hover-lift"
                style={{
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  height: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "22px" }}>{icon}</span>
                  <h3 style={{ fontSize: "17px", fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
                    {label}
                  </h3>
                </div>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.55, margin: 0, flex: 1 }}>
                  {desc}
                </p>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-accent)" }}>
                  Manage {label} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}