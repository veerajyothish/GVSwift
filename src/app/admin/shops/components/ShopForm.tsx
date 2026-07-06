"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface ShopFormProps {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    brandImage: string;
    description: string;
    tagline: string | null;
    isActive: boolean;
    isFeatured: boolean;
  };
}

export default function ShopForm({ initialData }: ShopFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [brandImage, setBrandImage] = useState(initialData?.brandImage ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [tagline, setTagline] = useState(initialData?.tagline ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-generate slug from name if not editing
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEdit) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Front-end validation
    if (!name.trim()) {
      setErrorMsg("Shop Name is required.");
      return;
    }
    if (!slug.trim()) {
      setErrorMsg("Shop Slug is required.");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setErrorMsg("Slug must only contain lowercase letters, numbers, and hyphens.");
      return;
    }
    if (!brandImage.trim()) {
      setErrorMsg("Brand Image URL is required.");
      return;
    }
    try {
      new URL(brandImage);
    } catch {
      setErrorMsg("Please enter a valid Brand Image URL (e.g. starting with https://).");
      return;
    }
    if (description.length < 10) {
      setErrorMsg("Description must be at least 10 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        brandImage: brandImage.trim(),
        description: description.trim(),
        tagline: tagline.trim() || null,
        isActive,
        isFeatured,
      };

      const url = isEdit
        ? `/api/v1/admin/shops/${initialData.id}`
        : "/api/v1/admin/shops";

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${isEdit ? "update" : "create"} shop.`);
      }

      setSuccessMsg(`Shop successfully ${isEdit ? "updated" : "created"}!`);
      
      // Redirect after a brief delay
      setTimeout(() => {
        router.push("/admin/shops");
        router.refresh();
      }, 1000);

    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Success banner */}
      {successMsg && (
        <div
          style={{
            background: "var(--color-success-bg, #ECFDF5)",
            border: "1px solid var(--color-success, #10B981)",
            color: "var(--color-success, #065F46)",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div
          style={{
            background: "var(--color-error-bg, #FEF2F2)",
            border: "1px solid var(--color-error, #EF4444)",
            color: "var(--color-error, #991B1B)",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          ⚠ {errorMsg}
        </div>
      )}

      {/* Row 1: Brand Name & Slug */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }} className="form-grid-2">
        <style>{`
          @media (min-width: 640px) {
            .form-grid-2 {
              grid-template-columns: 1fr 1fr !important;
            }
          }
        `}</style>
        <div className="input-group">
          <label className="input-required" style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
            Brand / Shop Name
          </label>
          <input
            type="text"
            className="input-field"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Atelier Nirmala"
            required
            disabled={isSubmitting}
            style={{ width: "100%", height: "40px" }}
          />
        </div>

        <div className="input-group">
          <label className="input-required" style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
            Shop Slug (URL path)
          </label>
          <input
            type="text"
            className="input-field"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
            placeholder="e.g. atelier-nirmala"
            required
            disabled={isSubmitting}
            style={{ width: "100%", height: "40px" }}
          />
        </div>
      </div>

      {/* Row 2: Brand Image URL */}
      <div className="input-group">
        <label className="input-required" style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
          Brand Logo / Banner Image URL
        </label>
        <input
          type="url"
          className="input-field"
          value={brandImage}
          onChange={(e) => setBrandImage(e.target.value)}
          placeholder="e.g. https://images.unsplash.com/... or /shops/brand-logo.jpg"
          required
          disabled={isSubmitting}
          style={{ width: "100%", height: "40px" }}
        />
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0, marginTop: "4px" }}>
          Provide a premium high-resolution cover photo or logo image URL for the shop page banner and cards.
        </p>
      </div>

      {/* Row 3: Tagline */}
      <div className="input-group">
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
          Shop Tagline (Optional)
        </label>
        <input
          type="text"
          className="input-field"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g. Handcrafted linen garments & bespoke sarees"
          disabled={isSubmitting}
          style={{ width: "100%", height: "40px" }}
        />
      </div>

      {/* Row 4: Description */}
      <div className="input-group">
        <label className="input-required" style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
          Shop Description / Brand Story
        </label>
        <textarea
          className="input-field"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the offline store, its specialty collections, location context, and heritage craft story..."
          required
          disabled={isSubmitting}
          style={{ width: "100%", minHeight: "120px", padding: "10px 12px", fontFamily: "inherit" }}
        />
      </div>

      {/* Row 5: Visibility Checkboxes */}
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", margin: "8px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={isSubmitting}
            style={{ cursor: "pointer", width: "18px", height: "18px", accentColor: "var(--color-accent)" }}
          />
          <label htmlFor="isActive" style={{ cursor: "pointer", fontWeight: 600, fontSize: "13px", userSelect: "none" }}>
            Active (Visible on storefront)
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            id="isFeatured"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            disabled={isSubmitting}
            style={{ cursor: "pointer", width: "18px", height: "18px", accentColor: "var(--color-accent)" }}
          />
          <label htmlFor="isFeatured" style={{ cursor: "pointer", fontWeight: 600, fontSize: "13px", userSelect: "none" }}>
            Featured (Highlight on landing page)
          </label>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "16px", marginTop: "12px", paddingTop: "20px", borderTop: "1px solid var(--color-border)" }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push("/admin/shops")}
          disabled={isSubmitting}
          style={{ flex: 1, height: "44px" }}
        >
          Cancel
        </button>

        <button
          type="submit"
          className={`btn btn-primary ${isSubmitting ? "btn-loading" : ""}`}
          disabled={isSubmitting}
          style={{ flex: 2, height: "44px" }}
        >
          {isEdit ? "Update Shop Profile" : "Create Shop Partner"}
        </button>
      </div>
    </form>
  );
}
