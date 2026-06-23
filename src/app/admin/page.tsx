import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-semibold mb-8 text-primary">
          GVSwift Admin Console
        </h1>
        <p className="text-secondary">
          Manage your products, configure fraud/risk thresholds, and tune operational parameters.
        </p>
      </header>

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

