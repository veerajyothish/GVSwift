"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";

// Since it's a client component, let's define the local Banner type
export type BannerType = "INFO" | "SUCCESS" | "WARNING" | "PROMO";

export interface Banner {
  id: string;
  message: string;
  type: BannerType;
  isActive: boolean;
  linkText: string | null;
  linkUrl: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface BannersListTableProps {
  initialBanners: Banner[];
}

export default function BannersListTable({ initialBanners }: BannersListTableProps) {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form State
  const [message, setMessage] = useState("");
  const [type, setType] = useState<BannerType>("INFO");
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isActive, setIsActive] = useState(false);

  // Status/Error State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingBanner(null);
    setMessage("");
    setType("INFO");
    setLinkText("");
    setLinkUrl("");
    setIsActive(false);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setMessage(banner.message);
    setType(banner.type);
    setLinkText(banner.linkText || "");
    setLinkUrl(banner.linkUrl || "");
    setIsActive(banner.isActive);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Message is required.");
      return;
    }
    if (message.length > 200) {
      setError("Message cannot exceed 200 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      message,
      type,
      linkText: linkText.trim() || null,
      linkUrl: linkUrl.trim() || null,
      isActive,
    };

    try {
      const url = editingBanner
        ? `/api/v1/admin/banners/${editingBanner.id}`
        : "/api/v1/admin/banners";
      const method = editingBanner ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to save banner.");
      }

      const savedBanner = await res.json();

      if (editingBanner) {
        // Update list
        setBanners((prev) =>
          prev.map((b) => {
            if (b.id === savedBanner.id) {
              return savedBanner;
            }
            if (savedBanner.isActive && b.id !== savedBanner.id) {
              // Deactivate others
              return { ...b, isActive: false };
            }
            return b;
          })
        );
      } else {
        // Add new banner
        setBanners((prev) => {
          const newList = [savedBanner, ...prev];
          if (savedBanner.isActive) {
            return newList.map((b) => (b.id === savedBanner.id ? b : { ...b, isActive: false }));
          }
          return newList;
        });
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (bannerId: string, currentActive: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/banners/${bannerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Failed to toggle banner status.");
        return;
      }

      const updatedBanner = await res.json();

      setBanners((prev) =>
        prev.map((b) => {
          if (b.id === updatedBanner.id) {
            return updatedBanner;
          }
          if (updatedBanner.isActive && b.id !== updatedBanner.id) {
            return { ...b, isActive: false };
          }
          return b;
        })
      );

      router.refresh();
    } catch {
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bannerId: string, bannerMessage: string) => {
    const messageSnippet = bannerMessage.length > 30 ? bannerMessage.substring(0, 30) + "..." : bannerMessage;
    if (!confirm(`Delete banner "${messageSnippet}"? This action cannot be undone.`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/banners/${bannerId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Failed to delete banner.");
        return;
      }

      setBanners((prev) => prev.filter((b) => b.id !== bannerId));
      router.refresh();
    } catch {
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadgeClass = (t: BannerType) => {
    switch (t) {
      case "INFO":
        return "admin-badge admin-badge-info";
      case "SUCCESS":
        return "admin-badge admin-badge-success";
      case "WARNING":
        return "admin-badge admin-badge-warning";
      case "PROMO":
        return "admin-badge"; // Styled inline with brand primary
    }
  };


  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Banners & Announcements</h1>
          <p className="admin-page-subtitle">
            Configure site-wide storefront banner notifications. Only one banner can be active at a time.
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary" id="add-banner-btn">
          <svg
            style={{ marginRight: "6px", width: "16px", height: "16px", display: "inline-block", verticalAlign: "middle" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Banner
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📢</div>
          <h3 className="empty-state-title">No banners yet</h3>
          <p className="empty-state-text">Create your first site-wide banner announcement.</p>
          <button
            onClick={openCreateModal}
            className="btn btn-primary"
            style={{ marginTop: "20px" }}
          >
            Add Banner
          </button>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" aria-label="Banners list">
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Announcement Message</th>
                <th style={{ width: "12%" }}>Type</th>
                <th style={{ width: "20%" }}>Call to Action Link</th>
                <th style={{ width: "10%" }}>Active</th>
                <th style={{ width: "18%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id} className="admin-table-row">
                  <td className="admin-table-cell" style={{ wordBreak: "break-word", fontWeight: 500 }}>
                    {banner.message}
                  </td>
                  <td className="admin-table-cell">
                    {banner.type === "PROMO" ? (
                      <span
                        className={getTypeBadgeClass(banner.type)}
                        style={{
                          backgroundColor: "color-mix(in oklch, var(--color-accent) 12%, transparent)",
                          color: "var(--color-accent)",
                          border: "1px solid color-mix(in oklch, var(--color-accent) 25%, transparent)",
                        }}
                      >
                        PROMO
                      </span>
                    ) : (
                      <span className={getTypeBadgeClass(banner.type)}>{banner.type}</span>
                    )}
                  </td>
                  <td className="admin-table-cell">
                    {banner.linkText ? (
                      <div className="flex flex-col gap-0.5 text-13">
                        <span style={{ fontWeight: 600 }}>{banner.linkText}</span>
                        <code style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                          {banner.linkUrl}
                        </code>
                      </div>
                    ) : (
                      <span className="text-secondary">—</span>
                    )}
                  </td>
                  <td className="admin-table-cell">
                    <button
                      onClick={() => handleToggleActive(banner.id, banner.isActive)}
                      disabled={loading}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "1px solid",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      className={
                        banner.isActive
                          ? "bg-primary text-white border-transparent"
                          : "bg-surface text-secondary border-muted hover-bg-light"
                      }
                      id={`toggle-banner-${banner.id}`}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: banner.isActive ? "var(--color-success)" : "var(--color-text-secondary)",
                        }}
                      />
                      {banner.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="admin-table-cell" style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => openEditModal(banner)}
                        className="btn btn-sm btn-secondary"
                        disabled={loading}
                        id={`edit-banner-${banner.id}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id, banner.message)}
                        className="btn btn-sm btn-danger"
                        disabled={loading}
                        id={`delete-banner-${banner.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBanner ? "Edit Banner Announcement" : "Create Banner Announcement"}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {error && (
            <div
              style={{
                padding: "10px",
                backgroundColor: "var(--color-error-bg)",
                color: "var(--color-error)",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="admin-settings-label" style={{ fontWeight: 600 }}>
                Announcement Message *
              </label>
              <span className="text-11 text-secondary">{message.length}/200</span>
            </div>
            <textarea
              className="input-field"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Flat 15% off on all pre-orders using code SWIFT15!"
              maxLength={200}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="admin-settings-label" style={{ fontWeight: 600 }}>
              Banner Type
            </label>
            <select
              className="input-field"
              value={type}
              onChange={(e) => setType(e.target.value as BannerType)}
            >
              <option value="INFO">INFO (Blue Accent)</option>
              <option value="SUCCESS">SUCCESS (Green Accent)</option>
              <option value="WARNING">WARNING (Amber Accent)</option>
              <option value="PROMO">PROMO (Wine Red Brand Accent)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="admin-settings-label" style={{ fontWeight: 600 }}>
                Link Text (Optional)
              </label>
              <input
                type="text"
                className="input-field"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="e.g. Shop Now"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="admin-settings-label" style={{ fontWeight: 600 }}>
                Link URL (Optional)
              </label>
              <input
                type="text"
                className="input-field"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="e.g. /products/premium-jacket"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isActiveCheckbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--color-accent)" }}
            />
            <label htmlFor="isActiveCheckbox" className="admin-settings-label cursor-pointer" style={{ margin: 0, fontWeight: 500 }}>
              Set as active banner immediately (will deactivate any other active banner)
            </label>
          </div>

          <div className="admin-divider mt-2" />

          <div className="flex justify-end gap-3 mt-1">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="save-banner-submit">
              {loading ? "Saving..." : editingBanner ? "Save Changes" : "Create Banner"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
