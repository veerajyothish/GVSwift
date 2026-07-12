"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DailyDataEntry {
  date: string;
  revenue: number;
}

interface MonthlyDataEntry {
  month: string;
  revenue: number;
}

interface RevenueChartsProps {
  dailyData: DailyDataEntry[];
  monthlyData: MonthlyDataEntry[];
}

function formatCurrency(val: number): string {
  return "₹" + val.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function RevenueCharts({ dailyData, monthlyData }: RevenueChartsProps) {
  const [accentColor, setAccentColor] = useState("#6B1E2E");

  useEffect(() => {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim();
    if (val) setAccentColor(val);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "24px",
        marginBottom: "32px",
      }}
    >
      {/* Daily Revenue Line Chart */}
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-lg, 12px)",
          border: "1px solid var(--color-border)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading, 'EB Garamond', serif)",
            fontSize: "20px",
            color: "var(--color-text-primary)",
            margin: 0,
            fontWeight: 400,
          }}
        >
          Daily Revenue (Last 30 Days)
        </h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dailyData}
              margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="var(--color-text-secondary)"
                tickLine={false}
                style={{ fontSize: "11px", fontFamily: "var(--font-body)" }}
              />
              <YAxis
                stroke="var(--color-text-secondary)"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
                style={{ fontSize: "11px", fontFamily: "var(--font-body)" }}
              />
              <Tooltip
                formatter={(value: unknown) => [formatCurrency(Number(value || 0)), "Revenue"]}
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={accentColor}
                strokeWidth={2}
                dot={{ fill: accentColor, strokeWidth: 1 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Revenue Bar Chart */}
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-lg, 12px)",
          border: "1px solid var(--color-border)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading, 'EB Garamond', serif)",
            fontSize: "20px",
            color: "var(--color-text-primary)",
            margin: 0,
            fontWeight: 400,
          }}
        >
          Monthly Revenue (Last 12 Months)
        </h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="var(--color-text-secondary)"
                tickLine={false}
                style={{ fontSize: "11px", fontFamily: "var(--font-body)" }}
              />
              <YAxis
                stroke="var(--color-text-secondary)"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
                style={{ fontSize: "11px", fontFamily: "var(--font-body)" }}
              />
              <Tooltip
                formatter={(value: unknown) => [formatCurrency(Number(value || 0)), "Revenue"]}
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="revenue"
                fill={accentColor}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
