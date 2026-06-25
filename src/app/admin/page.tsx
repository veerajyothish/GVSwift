import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RevenueCharts from "./RevenueCharts";
import { getLowStockThreshold } from "@/features/settings/service";

export default async function AdminPage() {
  // 1. Total revenue — sum of all orders with status DELIVERED
  const revenueAggregation = await prisma.order.aggregate({
    _sum: {
      totalPaise: true,
    },
    where: {
      status: "DELIVERED",
    },
  });
  const totalRevenueRs = (revenueAggregation._sum.totalPaise ?? 0) / 100;

  // 2. Orders today — count of orders created today (midnight to now)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ordersToday = await prisma.order.count({
    where: {
      createdAt: {
        gte: todayStart,
      },
    },
  });

  // 3. Pending orders — count of orders with status PLACED or CONFIRMED
  const pendingOrders = await prisma.order.count({
    where: {
      status: {
        in: ["PLACED", "CONFIRMED"],
      },
    },
  });

  // 4. Total active users — count of users where blocked = false AND role != 'ADMIN'
  const activeUsers = await prisma.user.count({
    where: {
      blocked: false,
      role: {
        not: "ADMIN",
      },
    },
  });

  // 5. Total products — count of all products
  const totalProducts = await prisma.product.count();

  // 6. Low stock products — count distinct products where at least one variant has stock < threshold
  const lowStockThreshold = await getLowStockThreshold();
  const lowStockVariants = await prisma.productVariant.findMany({
    where: {
      stock: {
        lt: lowStockThreshold,
      },
    },
    select: {
      productId: true,
    },
  });
  const lowStockProductsCount = new Set(lowStockVariants.map((v) => v.productId)).size;

  // Indian currency formatting
  const formattedRevenue = "₹" + totalRevenueRs.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

  // Daily revenue for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const dailyOrders = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      createdAt: true,
      totalPaise: true,
    },
  });

  const dailyMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    dailyMap[dateKey] = 0;
  }

  dailyOrders.forEach((o) => {
    const dateKey = o.createdAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    if (dateKey in dailyMap) {
      dailyMap[dateKey] += o.totalPaise / 100;
    }
  });

  const dailyData = Object.entries(dailyMap).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  // Monthly revenue for the last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyOrders = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      createdAt: {
        gte: twelveMonthsAgo,
      },
    },
    select: {
      createdAt: true,
      totalPaise: true,
    },
  });

  const monthlyMap: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
    monthlyMap[monthKey] = 0;
  }

  monthlyOrders.forEach((o) => {
    const monthKey = o.createdAt.toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
    if (monthKey in monthlyMap) {
      monthlyMap[monthKey] += o.totalPaise / 100;
    }
  });

  const monthlyData = Object.entries(monthlyMap).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-8 pb-6 border-b border-color-border" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <h1 className="text-3xl font-semibold mb-2 text-primary font-heading" style={{ fontFamily: "var(--font-heading)" }}>
          Overview
        </h1>
        <p className="text-secondary text-sm">
          Here&apos;s what&apos;s happening with your cellar today. Manage your catalog, view risk thresholds, and check sales metrics.
        </p>
      </header>

      {/* KPI Cards Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8"
      >
        {/* Total Revenue */}
        <div
          className="card hover-lift p-6 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "between",
          }}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Total Revenue
            </span>
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-primary"
              style={{ backgroundColor: "rgba(86, 25, 34, 0.08)", borderRadius: "6px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>account_balance_wallet</span>
            </div>
          </div>
          <div>
            <h3
              className="font-heading"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "26px",
                fontWeight: "600",
                color: "var(--color-primary)",
                margin: 0,
              }}
            >
              {formattedRevenue}
            </h3>
            <p className="text-xs text-secondary mt-1">Delivered orders sum</p>
          </div>
        </div>

        {/* Orders Today */}
        <div
          className="card hover-lift p-6 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "between",
          }}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Orders Today
            </span>
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-primary"
              style={{ backgroundColor: "rgba(86, 25, 34, 0.08)", borderRadius: "6px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>receipt</span>
            </div>
          </div>
          <div>
            <h3
              className="font-heading"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "26px",
                fontWeight: "600",
                color: "var(--color-primary)",
                margin: 0,
              }}
            >
              {ordersToday.toLocaleString("en-IN")}
            </h3>
            <p className="text-xs text-secondary mt-1">Placed since midnight</p>
          </div>
        </div>

        {/* Pending Orders */}
        <div
          className="card hover-lift p-6 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "between",
          }}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Pending Orders
            </span>
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-primary"
              style={{ backgroundColor: "rgba(86, 25, 34, 0.08)", borderRadius: "6px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>pending_actions</span>
            </div>
          </div>
          <div>
            <h3
              className="font-heading"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "26px",
                fontWeight: "600",
                color: "var(--color-primary)",
                margin: 0,
              }}
            >
              {pendingOrders.toLocaleString("en-IN")}
            </h3>
            <p className="text-xs text-secondary mt-1">Awaiting confirmation</p>
          </div>
        </div>

        {/* Active Customers */}
        <div
          className="card hover-lift p-6 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "between",
          }}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Active Customers
            </span>
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-primary"
              style={{ backgroundColor: "rgba(86, 25, 34, 0.08)", borderRadius: "6px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>groups</span>
            </div>
          </div>
          <div>
            <h3
              className="font-heading"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "26px",
                fontWeight: "600",
                color: "var(--color-primary)",
                margin: 0,
              }}
            >
              {activeUsers.toLocaleString("en-IN")}
            </h3>
            <p className="text-xs text-secondary mt-1">Non-blocked buyers</p>
          </div>
        </div>

        {/* Total Products */}
        <div
          className="card hover-lift p-6 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "between",
          }}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Total Products
            </span>
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-primary"
              style={{ backgroundColor: "rgba(86, 25, 34, 0.08)", borderRadius: "6px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>inventory_2</span>
            </div>
          </div>
          <div>
            <h3
              className="font-heading"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "26px",
                fontWeight: "600",
                color: "var(--color-primary)",
                margin: 0,
              }}
            >
              {totalProducts.toLocaleString("en-IN")}
            </h3>
            <p className="text-xs text-secondary mt-1">Active catalog count</p>
          </div>
        </div>

        {/* Low Stock Products */}
        <div
          className="card hover-lift p-6 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "between",
            borderColor: lowStockProductsCount > 0 ? "var(--color-error)" : "var(--color-border)",
          }}
        >
          <div className="flex justify-between items-start">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: lowStockProductsCount > 0 ? "var(--color-error)" : "var(--color-text-secondary)" }}
            >
              Low Stock
            </span>
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{
                backgroundColor: lowStockProductsCount > 0 ? "rgba(220, 38, 38, 0.08)" : "rgba(86, 25, 34, 0.08)",
                borderRadius: "6px",
                color: lowStockProductsCount > 0 ? "var(--color-error)" : "var(--color-primary)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>warning</span>
            </div>
          </div>
          <div>
            <h3
              className="font-heading"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "26px",
                fontWeight: "600",
                color: lowStockProductsCount > 0 ? "var(--color-error)" : "var(--color-primary)",
                margin: 0,
              }}
            >
              {lowStockProductsCount.toLocaleString("en-IN")}
            </h3>
            <Link
              href="/admin/products?filter=lowstock"
              className="text-xs mt-1 block hover:text-accent font-medium transition-colors"
              style={{
                color: lowStockProductsCount > 0 ? "var(--color-error)" : "var(--color-primary)",
                textDecoration: "underline",
              }}
            >
              Manage Stock &rarr;
            </Link>
          </div>
        </div>
      </div>

      <RevenueCharts dailyData={dailyData} monthlyData={monthlyData} />

      <div className="admin-grid">
        {/* Products Card */}
        <Link href="/admin/products" className="flex flex-col h-full">
          <div className="card card-interactive p-5 flex flex-col gap-3 h-full">
            <div className="flex items-center gap-3">
              <div className="text-xl text-accent">📦</div>
              <h2 className="text-xl font-medium margin-0">Products</h2>
            </div>
            <p className="text-secondary text-sm flex-1">
              View and edit your product catalog, add new products, customize sizes/colors, manage inventory and stock levels, and upload images.
            </p>
            <span className="text-accent font-medium text-sm flex items-center gap-1">
              Manage Products &rarr;
            </span>
          </div>
        </Link>

        {/* Risk Card */}
        <Link href="/admin/risk" className="flex flex-col h-full">
          <div className="card card-interactive p-5 flex flex-col gap-3 h-full">
            <div className="flex items-center gap-3">
              <div className="text-xl text-accent">🛡️</div>
              <h2 className="text-xl font-medium margin-0">Risk Rules</h2>
            </div>
            <p className="text-secondary text-sm flex-1">
              Configure COD eligibility, blacklists, and manual review triggers for specific phone numbers, addresses, pincodes, and users.
            </p>
            <span className="text-accent font-medium text-sm flex items-center gap-1">
              Manage Risk Flags &rarr;
            </span>
          </div>
        </Link>

        {/* Settings Card */}
        <Link href="/admin/settings" className="flex flex-col h-full">
          <div className="card card-interactive p-5 flex flex-col gap-3 h-full">
            <div className="flex items-center gap-3">
              <div className="text-xl text-accent">⚙️</div>
              <h2 className="text-xl font-medium margin-0">Settings</h2>
            </div>
            <p className="text-secondary text-sm flex-1">
              Adjust operational constants such as the maximum COD order value limit, return windows, cancellation cutoff status, and delivery attempts.
            </p>
            <span className="text-accent font-medium text-sm flex items-center gap-1">
              Edit System Settings &rarr;
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

