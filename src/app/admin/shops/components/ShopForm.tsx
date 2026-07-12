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
  const [isUploading, setIsUploading] = useState(false);
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

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);
    setIsUploading(true);

    try {
      const file = files[0];

      // Client-side size check (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size exceeds the 5MB limit");
      }

      // Client-side extension check
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["jpg", "jpeg", "png", "webp"].includes(ext)) {
        throw new Error("Only JPEG, PNG, and WEBP image formats are allowed.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/admin/products/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Image upload failed");
      }

      setBrandImage(data.url);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred during file upload.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
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
      setErrorMsg("Brand Image is required. Please upload an image.");
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
            background: "var(--color-success-bg)",
            border: "1px solid var(--color-success)",
            color: "var(--color-success)",
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
            background: "var(--color-error-bg)",
            border: "1px solid var(--color-error)",
            color: "var(--color-error)",
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

      {/* Row 2: Brand Image File Upload */}
      <div className="input-group">
        <label className="input-required" style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
          Brand Logo / Banner Image
        </label>
        
        {brandImage ? (
          <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ position: "relative", width: "120px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandImage} alt="Brand Logo Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setBrandImage("")}
              disabled={isSubmitting || isUploading}
            >
              Remove and Upload Different Image
            </button>
          </div>
        ) : (
          <div
            style={{
              border: "2px dashed var(--color-border)",
              borderRadius: "var(--radius-md, 8px)",
              padding: "24px",
              textAlign: "center",
              cursor: isSubmitting || isUploading ? "not-allowed" : "pointer",
              backgroundColor: "rgba(86, 25, 34, 0.02)",
              position: "relative",
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={isSubmitting || isUploading}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: isSubmitting || isUploading ? "not-allowed" : "pointer",
              }}
            />
            <svg style={{ width: "32px", height: "32px", color: "var(--color-accent)", margin: "0 auto 8px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-semibold text-sm mb-2" style={{ margin: "4px 0" }}>
              {isUploading ? "Uploading..." : "Click to select brand logo / banner image"}
            </p>
            <p className="text-secondary text-xs" style={{ margin: 0 }}>
              JPEG, PNG, or WEBP formats only. Max 5MB file size.
            </p>
          </div>
        )}
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
