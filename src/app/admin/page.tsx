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
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-semibold mb-8 text-primary" style={{ fontFamily: "var(--font-heading)" }}>
          GVSwift Admin Console
        </h1>
        <p className="text-secondary">
          Manage your products, configure fraud/risk thresholds, and tune operational parameters.
        </p>
      </header>

      {/* KPI Cards Grid */}
      <div
        className="kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Total Revenue */}
        <div
          className="card"
          style={{
            padding: "20px",
            borderRadius: "var(--radius-lg, 12px)",
            backgroundColor: "var(--color-bg-card, #fcf9f8)",
            border: "1px solid var(--color-border)",
            borderLeft: "4px solid var(--color-primary)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <span className="text-xs font-semibold text-secondary" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Total Revenue
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading, 'EB Garamond', serif)",
              fontSize: "26px",
              fontWeight: "600",
              color: "var(--color-primary)",
            }}
          >
            {formattedRevenue}
          </span>
        </div>

        {/* Orders Today */}
        <div
          className="card"
          style={{
            padding: "20px",
            borderRadius: "var(--radius-lg, 12px)",
            backgroundColor: "var(--color-bg-card, #fcf9f8)",
            border: "1px solid var(--color-border)",
            borderLeft: "4px solid var(--color-primary)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <span className="text-xs font-semibold text-secondary" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Orders Today
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading, 'EB Garamond', serif)",
              fontSize: "26px",
              fontWeight: "600",
              color: "var(--color-primary)",
            }}
          >
            {ordersToday.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Pending Orders */}
        <div
          className="card"
          style={{
            padding: "20px",
            borderRadius: "var(--radius-lg, 12px)",
            backgroundColor: "var(--color-bg-card, #fcf9f8)",
            border: "1px solid var(--color-border)",
            borderLeft: "4px solid var(--color-primary)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <span className="text-xs font-semibold text-secondary" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Pending Orders
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading, 'EB Garamond', serif)",
              fontSize: "26px",
              fontWeight: "600",
              color: "var(--color-primary)",
            }}
          >
            {pendingOrders.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Total Active Users */}
        <div
          className="card"
          style={{
            padding: "20px",
            borderRadius: "var(--radius-lg, 12px)",
            backgroundColor: "var(--color-bg-card, #fcf9f8)",
            border: "1px solid var(--color-border)",
            borderLeft: "4px solid var(--color-primary)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <span className="text-xs font-semibold text-secondary" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Active Customers
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading, 'EB Garamond', serif)",
              fontSize: "26px",
              fontWeight: "600",
              color: "var(--color-primary)",
            }}
          >
            {activeUsers.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Total Products */}
        <div
          className="card"
          style={{
            padding: "20px",
            borderRadius: "var(--radius-lg, 12px)",
            backgroundColor: "var(--color-bg-card, #fcf9f8)",
            border: "1px solid var(--color-border)",
            borderLeft: "4px solid var(--color-primary)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <span className="text-xs font-semibold text-secondary" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Total Products
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading, 'EB Garamond', serif)",
              fontSize: "26px",
              fontWeight: "600",
              color: "var(--color-primary)",
            }}
          >
            {totalProducts.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Low Stock Products */}
        <div
          className="card"
          style={{
            padding: "20px",
            borderRadius: "var(--radius-lg, 12px)",
            backgroundColor: "var(--color-bg-card, #fcf9f8)",
            border: "1px solid var(--color-border)",
            borderLeft: `4px solid ${lowStockProductsCount > 0 ? "var(--color-error)" : "var(--color-primary)"}`,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <span className="text-xs font-semibold text-secondary" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Low Stock Products
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading, 'EB Garamond', serif)",
              fontSize: "26px",
              fontWeight: "600",
              color: lowStockProductsCount > 0 ? "var(--color-error)" : "var(--color-primary)",
            }}
          >
            {lowStockProductsCount.toLocaleString("en-IN")}
          </span>
          <Link
            href="/admin/products?filter=lowstock"
            style={{ fontSize: "12px", color: "var(--color-primary)", textDecoration: "underline", marginTop: "2px" }}
          >
            View low stock items →
          </Link>
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

