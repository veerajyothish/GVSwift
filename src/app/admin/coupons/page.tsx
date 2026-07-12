import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";
import CouponActionsCell from "./CouponActionsCell";

export const metadata: Metadata = {
  title: "Coupon Management — GVSwift Admin",
};

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Coupon Codes</h1>
          <p className="admin-page-subtitle">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link href="/admin/coupons/new" className="btn btn-primary">
          <svg style={{ marginRight: "6px", width: "16px", height: "16px", verticalAlign: "middle" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Coupon
        </Link>
      </div>

      {coupons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎟️</div>
          <h3 className="empty-state-title">No coupons yet</h3>
          <p className="empty-state-text">Create your first discount coupon code.</p>
          <Link href="/admin/coupons/new" className="btn btn-primary" style={{ marginTop: "20px", display: "inline-flex" }}>
            Add Coupon
          </Link>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" aria-label="Coupon list">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Usage</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const discountLabel =
                  coupon.discountType === "PERCENTAGE"
                    ? `${coupon.discountValue}%`
                    : `₹${(coupon.discountValue / 100).toLocaleString("en-IN")}`;
                const usageLabel =
                  coupon.maxUsage === 0
                    ? `${coupon.usageCount} / ∞`
                    : `${coupon.usageCount} / ${coupon.maxUsage}`;

                return (
                  <tr key={coupon.id} className="admin-table-row">
                    <td className="admin-table-cell">
                      <code style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "0.05em", color: "var(--color-accent)" }}>
                        {coupon.code}
                      </code>
                    </td>
                    <td className="admin-table-cell">{discountLabel}</td>
                    <td className="admin-table-cell">
                      {coupon.minOrderPaise > 0
                        ? `₹${(coupon.minOrderPaise / 100).toLocaleString("en-IN")}`
                        : "None"}
                    </td>
                    <td className="admin-table-cell">{usageLabel}</td>
                    <td className="admin-table-cell admin-table-cell-secondary">{formatDate(coupon.validUntil)}</td>
                    <td className="admin-table-cell">
                      {coupon.isActive ? (
                        <span className="admin-badge admin-badge-success">Active</span>
                      ) : (
                        <span className="admin-badge admin-badge-error">Inactive</span>
                      )}
                    </td>
                    <td className="admin-table-cell" style={{ textAlign: "right" }}>
                      <CouponActionsCell id={coupon.id} code={coupon.code} isActive={coupon.isActive} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
