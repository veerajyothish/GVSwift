"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import type { PaginatedRiskFlagsResult, RiskFlag } from "@/features/risk/types";

interface RiskManagerProps {
  initialData: PaginatedRiskFlagsResult;
}

export default function RiskManager({ initialData }: RiskManagerProps) {
  const { toast } = useToast();
  
  // State for listing & search filters
  const [flags, setFlags] = useState<RiskFlag[]>(initialData.flags);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [page, setPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [limit] = useState(initialData.limit);
  
  const [filterType, setFilterType] = useState<string>("");
  const [filterLevel, setFilterLevel] = useState<string>("");
  const [searchVal, setSearchVal] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // State for creating a new flag
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newType, setNewType] = useState<string>("PHONE");
  const [newValue, setNewValue] = useState<string>("");
  const [newLevel, setNewLevel] = useState<string>("LOW");
  const [newReason, setNewReason] = useState<string>("");
  const [createLoading, setCreateLoading] = useState(false);

  // Fetch flags whenever filters or page changes
  const fetchFlags = async (targetPage: number) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: targetPage.toString(),
        limit: limit.toString(),
      });
      if (filterType) queryParams.set("entityType", filterType);
      if (filterLevel) queryParams.set("riskLevel", filterLevel);
      if (searchVal) queryParams.set("entityValue", searchVal);

      const res = await fetch(`/api/v1/admin/risk?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch risk flags");
      }
      const data: PaginatedRiskFlagsResult = await res.json();
      setFlags(data.flags);
      setTotalCount(data.totalCount);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not retrieve risk flags", "Error");
    } finally {
      setLoading(false);
    }
  };

  // Trigger search/filter submit
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFlags(1);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilterType("");
    setFilterLevel("");
    setSearchVal("");
    // We defer the fetch to the useEffect that will watch changes, or call it directly:
    setTimeout(() => fetchFlags(1), 0);
  };

  // Create a new risk flag
  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) {
      toast.error("Entity Value is required", "Validation Error");
      return;
    }
    if (!newReason.trim()) {
      toast.error("A reason is required to document this manual risk flag change", "Validation Error");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch("/api/v1/admin/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: newType,
          entityValue: newValue.trim(),
          riskLevel: newLevel,
          reason: newReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create risk flag");
      }

      toast.success(`Risk flag created for ${newType} "${newValue}"`, "Flag Created");
      
      // Reset form
      setNewValue("");
      setNewReason("");
      setShowCreateForm(false);
      
      // Refresh list
      fetchFlags(1);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not create risk flag", "Save Failed");
    } finally {
      setCreateLoading(false);
    }
  };

  // Delete a risk flag
  const handleDeleteFlag = async (id: string, type: string, val: string) => {
    const reason = window.prompt(`Are you sure you want to delete the risk flag for ${type} "${val}"?\nEnter reason for deletion:`);
    
    if (reason === null) return; // User cancelled
    
    if (reason.trim() === "") {
      toast.error("A reason is required to delete a risk flag", "Action Cancelled");
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/risk/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete risk flag");
      }

      toast.success("Risk flag removed successfully", "Flag Deleted");
      // Refresh current page
      fetchFlags(page);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not delete risk flag", "Delete Failed");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Create Flag Trigger & Form */}
      <div>
        {!showCreateForm ? (
          <Button onClick={() => setShowCreateForm(true)} variant="primary">
            + Create Manual Risk Flag
          </Button>
        ) : (
          <form onSubmit={handleCreateFlag} className="card p-5 flex flex-col gap-4" style={{ maxWidth: "600px" }}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-accent margin-0">Create Risk Flag</h2>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{ background: "transparent", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
            
            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="input-group margin-0">
                <label className="input-label">Entity Type</label>
                <select className="input-field" value={newType} onChange={(e) => setNewType(e.target.value)}>
                  <option value="PHONE">PHONE</option>
                  <option value="ADDRESS">ADDRESS</option>
                  <option value="PINCODE">PINCODE</option>
                  <option value="USER">USER</option>
                </select>
              </div>

              <div className="input-group margin-0">
                <label className="input-label">Risk Level</label>
                <select className="input-field" value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>
            </div>

            <div className="input-group margin-0">
              <label className="input-label">Entity Value</label>
              <input
                type="text"
                className="input-field"
                placeholder={
                  newType === "PHONE" ? "+919876543210" :
                  newType === "PINCODE" ? "530001" :
                  newType === "USER" ? "user-uuid" : "Address ID / Unique string"
                }
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                required
              />
            </div>

            <div className="input-group margin-0">
              <label className="input-label">Reason for Flagging</label>
              <textarea
                className="input-field"
                placeholder="Required. Provide justification for this risk override..."
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={createLoading}>
                Save Flag
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Filter / Search Form */}
      <form onSubmit={handleFilterSubmit} className="card p-4 flex flex-wrap gap-4 items-end">
        <div className="input-group margin-0" style={{ flex: "1 1 200px" }}>
          <label className="input-label text-sm">Search Value</label>
          <input
            type="text"
            className="input-field"
            style={{ minHeight: "38px", padding: "8px 12px" }}
            placeholder="Search phone, pincode, user..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </div>

        <div className="input-group margin-0" style={{ flex: "1 1 150px" }}>
          <label className="input-label text-sm">Entity Type</label>
          <select
            className="input-field"
            style={{ minHeight: "38px", padding: "8px 12px" }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="PHONE">PHONE</option>
            <option value="ADDRESS">ADDRESS</option>
            <option value="PINCODE">PINCODE</option>
            <option value="USER">USER</option>
          </select>
        </div>

        <div className="input-group margin-0" style={{ flex: "1 1 150px" }}>
          <label className="input-label text-sm">Risk Level</label>
          <select
            className="input-field"
            style={{ minHeight: "38px", padding: "8px 12px" }}
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button type="button" variant="secondary" onClick={handleResetFilters} style={{ minHeight: "38px", padding: "8px 16px" }}>
            Reset
          </Button>
          <Button type="submit" variant="primary" loading={loading} style={{ minHeight: "38px", padding: "8px 16px" }}>
            Filter
          </Button>
        </div>
      </form>

      {/* Flag List */}
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Entity Type</th>
              <th>Entity Value</th>
              <th>Risk Level</th>
              <th>Date Added</th>
              <th style={{ width: "100px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {flags.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-secondary py-20">
                  No risk flags found.
                </td>
              </tr>
            ) : (
              flags.map((flag) => (
                <tr key={flag.id}>
                  <td>
                    <span className="admin-badge admin-badge-info">
                      {flag.entityType}
                    </span>
                  </td>
                  <td className="font-mono">{flag.entityValue}</td>
                  <td>
                    <span className={`admin-badge ${
                      flag.riskLevel === "BLOCKED" || flag.riskLevel === "HIGH"
                        ? "admin-badge-error"
                        : flag.riskLevel === "MEDIUM"
                        ? "admin-badge-warning"
                        : "admin-badge-success"
                    }`}>
                      {flag.riskLevel}
                    </span>
                  </td>
                  <td className="text-secondary">
                    {new Date(flag.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteFlag(flag.id, flag.entityType, flag.entityValue)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-8">
          <span className="text-secondary text-sm">
            Showing page {page} of {totalPages} ({totalCount} total flags)
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => fetchFlags(page - 1)}
              style={{ minHeight: "36px", padding: "4px 12px" }}
            >
              &larr; Prev
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => fetchFlags(page + 1)}
              style={{ minHeight: "36px", padding: "4px 12px" }}
            >
              Next &rarr;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
