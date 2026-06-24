"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ── Types ─────────────────────────────────────────────────────── */
interface Customer {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  blocked: boolean;
  role: string;
  orderCount: number;
  addressCount: number;
  totalSpendPaise: number;
}

interface CustomerTableProps {
  customers: Customer[];
  search: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

/* ── Helpers ────────────────────────────────────────────────────── */
function formatRupees(paise: number): string {
  const rupees = Math.floor(paise / 100);
  return "₹" + rupees.toLocaleString("en-IN");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ── StatusBadge ────────────────────────────────────────────────── */
function StatusBadge({ blocked }: { blocked: boolean }) {
  return (
    <span
      className={`customer-status-badge ${blocked ? "customer-status-blocked" : "customer-status-active"}`}
    >
      {blocked ? "Blocked" : "Active"}
    </span>
  );
}

/* ── CustomerDetailModal ────────────────────────────────────────── */
function CustomerDetailModal({
  customer,
  onClose,
  onToggleBlock,
  isToggling,
}: {
  customer: Customer;
  onClose: () => void;
  onToggleBlock: () => void;
  isToggling: boolean;
}) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-modal-title"
    >
      <div className="modal-panel customer-modal-panel">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 id="customer-modal-title" className="modal-title">
              {customer.name ?? "—"}
            </h2>
            <p className="modal-subtitle">{customer.email}</p>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close customer details"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Status row */}
          <div className="customer-modal-row">
            <span className="customer-modal-label">Status</span>
            <StatusBadge blocked={customer.blocked} />
          </div>

          <div className="customer-modal-row">
            <span className="customer-modal-label">Joined</span>
            <span className="customer-modal-value">{formatDate(customer.createdAt)}</span>
          </div>

          <div className="customer-modal-row">
            <span className="customer-modal-label">Total Orders</span>
            <span className="customer-modal-value">{customer.orderCount}</span>
          </div>

          <div className="customer-modal-row">
            <span className="customer-modal-label">Total Spend</span>
            <span className="customer-modal-value">{formatRupees(customer.totalSpendPaise)}</span>
          </div>

          <div className="customer-modal-row">
            <span className="customer-modal-label">Saved Addresses</span>
            <span className="customer-modal-value">{customer.addressCount}</span>
          </div>

          <div className="customer-modal-row">
            <span className="customer-modal-label">User ID</span>
            <span className="customer-modal-value customer-modal-id">{customer.id}</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          <button
            onClick={onToggleBlock}
            disabled={isToggling}
            className={`btn ${customer.blocked ? "btn-success" : "btn-danger"}`}
          >
            {isToggling
              ? customer.blocked
                ? "Unblocking…"
                : "Blocking…"
              : customer.blocked
              ? "Unblock Customer"
              : "Block Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function CustomerTable({
  customers,
  search,
  currentPage,
  totalPages,
  totalCount,
}: CustomerTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);
  const [isToggling, setIsToggling] = useState(false);
  const [, startTransition] = useTransition();

  // Sync if server re-renders with new data
  if (customers !== localCustomers && !selectedCustomer) {
    setLocalCustomers(customers);
  }

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams();
      if (searchValue.trim()) params.set("search", searchValue.trim());
      params.set("page", "1");
      router.push(`/admin/customers?${params.toString()}`);
    },
    [router, searchValue]
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(newPage));
    router.push(`/admin/customers?${params.toString()}`);
  };

  const handleToggleBlock = async () => {
    if (!selectedCustomer || isToggling) return;
    setIsToggling(true);
    try {
      const res = await fetch(
        `/api/v1/admin/customers/${selectedCustomer.id}/block`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error ?? "Failed to update customer status.");
        return;
      }
      const updated = await res.json();
      // Update local state immediately for instant feedback
      const newBlocked: boolean = updated.blocked;
      setLocalCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id ? { ...c, blocked: newBlocked } : c
        )
      );
      setSelectedCustomer((prev) =>
        prev ? { ...prev, blocked: newBlocked } : prev
      );
      // Refresh server data in background
      startTransition(() => {
        router.refresh();
      });
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsToggling(false);
    }
  };

  const openModal = (customer: Customer) => {
    // Find the latest local state for this customer
    const latest = localCustomers.find((c) => c.id === customer.id) ?? customer;
    setSelectedCustomer(latest);
  };

  return (
    <>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="customers-search-bar">
        <div className="customers-search-input-wrap">
          <span className="customers-search-icon" aria-hidden="true">🔍</span>
          <input
            id="customer-search-input"
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by name or email…"
            className="customers-search-input"
            aria-label="Search customers"
          />
        </div>
        <button type="submit" className="btn btn-primary customers-search-btn">
          Search
        </button>
        {search && (
          <button
            type="button"
            className="btn btn-secondary customers-search-btn"
            onClick={() => {
              setSearchValue("");
              router.push("/admin/customers");
            }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      {localCustomers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3 className="empty-state-title">No customers found</h3>
          <p className="empty-state-text">
            {search
              ? `No customers match "${search}". Try a different search term.`
              : "No customers have signed up yet."}
          </p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" aria-label="Customer list">
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Joined</th>
                <th scope="col">Orders</th>
                <th scope="col">Total Spend</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {localCustomers.map((customer) => (
                <tr key={customer.id} className="admin-table-row">
                  <td className="admin-table-cell">
                    <div className="customer-name-cell">
                      <div className="customer-avatar" aria-hidden="true">
                        {(customer.name ?? customer.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="customer-name">
                          {customer.name ?? "—"}
                        </div>
                        <div className="customer-email">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="admin-table-cell admin-table-cell-secondary">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="admin-table-cell">{customer.orderCount}</td>
                  <td className="admin-table-cell">
                    {formatRupees(customer.totalSpendPaise)}
                  </td>
                  <td className="admin-table-cell">
                    <StatusBadge blocked={customer.blocked} />
                  </td>
                  <td className="admin-table-cell">
                    <button
                      id={`view-customer-${customer.id}`}
                      onClick={() => openModal(customer)}
                      className="btn btn-sm btn-outline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="pagination" aria-label="Customer pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="pagination-btn"
            aria-label="Previous page"
          >
            ← Previous
          </button>
          <div className="pagination-info">
            Page {currentPage} of {totalPages} — {totalCount} customers
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="pagination-btn"
            aria-label="Next page"
          >
            Next →
          </button>
        </nav>
      )}

      {/* Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={
            localCustomers.find((c) => c.id === selectedCustomer.id) ??
            selectedCustomer
          }
          onClose={() => setSelectedCustomer(null)}
          onToggleBlock={handleToggleBlock}
          isToggling={isToggling}
        />
      )}
    </>
  );
}
