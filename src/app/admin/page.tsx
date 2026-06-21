import Link from "next/link";

export default function AdminPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text-primary)", marginBottom: "8px" }}>
          GVSwift Admin Console
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Manage your products, configure fraud/risk thresholds, and tune operational parameters.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
        {/* Products Card */}
        <Link href="/admin/products" style={{ display: "block" }}>
          <div className="card card-interactive" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ color: "var(--color-accent)", fontSize: "24px" }}>📦</div>
              <h2 className="text-xl font-medium" style={{ margin: 0 }}>Products</h2>
            </div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", flexGrow: 1 }}>
              View and edit your product catalog, add new products, customize sizes/colors, manage inventory and stock levels, and upload images.
            </p>
            <span style={{ color: "var(--color-accent)", fontWeight: 500, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
              Manage Products &rarr;
            </span>
          </div>
        </Link>

        {/* Risk Card */}
        <Link href="/admin/risk" style={{ display: "block" }}>
          <div className="card card-interactive" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ color: "var(--color-accent)", fontSize: "24px" }}>🛡️</div>
              <h2 className="text-xl font-medium" style={{ margin: 0 }}>Risk Rules</h2>
            </div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", flexGrow: 1 }}>
              Configure COD eligibility, blacklists, and manual review triggers for specific phone numbers, addresses, pincodes, and users.
            </p>
            <span style={{ color: "var(--color-accent)", fontWeight: 500, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
              Manage Risk Flags &rarr;
            </span>
          </div>
        </Link>

        {/* Settings Card */}
        <Link href="/admin/settings" style={{ display: "block" }}>
          <div className="card card-interactive" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ color: "var(--color-accent)", fontSize: "24px" }}>⚙️</div>
              <h2 className="text-xl font-medium" style={{ margin: 0 }}>Settings</h2>
            </div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", flexGrow: 1 }}>
              Adjust operational constants such as the maximum COD order value limit, return windows, cancellation cutoff status, and delivery attempts.
            </p>
            <span style={{ color: "var(--color-accent)", fontWeight: 500, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
              Edit System Settings &rarr;
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
