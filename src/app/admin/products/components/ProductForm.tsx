"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface VariantInput {
  id?: string;
  sku: string;
  stock: number;
  priceDeltaRupees: string; // user edits in Rupees, we convert to Paise
}

interface ImageInput {
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface ProductFormProps {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    basePricePaise: number;
    isActive: boolean;
    categoryId: string | null;
    variants: Array<{
      id: string;
      sku: string;
      stock: number;
      priceDeltaPaise: number;
    }>;
    images: Array<{
      url: string;
      altText: string | null;
      isPrimary: boolean;
      sortOrder: number;
    }>;
  };
  categories: Array<{ id: string; name: string }>;
}

export default function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  // Basic product details
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [basePriceRupees, setBasePriceRupees] = useState(
    initialData ? (initialData.basePricePaise / 100).toString() : ""
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");

  // Variants state
  const [variants, setVariants] = useState<VariantInput[]>(
    initialData?.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      stock: v.stock,
      priceDeltaRupees: (v.priceDeltaPaise / 100).toString(),
    })) ?? []
  );

  // Images state
  const [images, setImages] = useState<ImageInput[]>(
    initialData?.images.map((img) => ({
      url: img.url,
      altText: img.altText ?? "",
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })) ?? []
  );

  // Loading and error states
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

  // Variants handlers
  const addVariant = () => {
    setVariants([...variants, { sku: "", stock: 0, priceDeltaRupees: "0" }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantInput, value: string | number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value } as unknown as VariantInput;
    setVariants(updated);
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= 8) {
      setErrorMsg("A product can have a maximum of 8 images.");
      return;
    }

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

      // Automatically set the first image as primary if none are primary
      const hasPrimary = images.some((img) => img.isPrimary);

      setImages([
        ...images,
        {
          url: data.url,
          altText: "", // Alt text is required, must be filled by user
          isPrimary: !hasPrimary,
          sortOrder: images.length,
        },
      ]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred during file upload.");
    } finally {
      setIsUploading(false);
      // Reset input element value to allow uploading same file again
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    // If the primary image was removed, assign primary to the first available image
    if (images[index]?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setImages(updated);
  };

  const updateImage = (index: number, field: keyof ImageInput, value: string | boolean | number) => {
    const updated = [...images];
    if (field === "isPrimary" && value === true) {
      // Ensure only one primary image
      updated.forEach((img, i) => {
        img.isPrimary = i === index;
      });
    } else {
      updated[index] = { ...updated[index], [field]: value } as unknown as ImageInput;
    }
    setImages(updated);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Frontend validations
    if (!name.trim()) {
      setErrorMsg("Product Name is required.");
      return;
    }
    if (!slug.trim()) {
      setErrorMsg("Product Slug is required.");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setErrorMsg("Slug must only contain lowercase letters, numbers, and hyphens.");
      return;
    }
    if (isNaN(parseFloat(basePriceRupees)) || parseFloat(basePriceRupees) < 0) {
      setErrorMsg("Base price must be a non-negative number.");
      return;
    }

    // Verify all images have Alt Text
    for (let i = 0; i < images.length; i++) {
      if (!images[i].altText.trim()) {
        setErrorMsg(`Alt text is required for Image ${i + 1}.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const basePricePaise = Math.round(parseFloat(basePriceRupees) * 100);

      // Map variants to correct types
      const mappedVariants = variants.map((v) => ({
        id: v.id,
        sku: v.sku.trim(),
        stock: v.stock,
        priceDeltaPaise: Math.round(parseFloat(v.priceDeltaRupees || "0") * 100),
      }));

      // Validate variant fields
      for (const v of mappedVariants) {
        if (!v.sku) {
          throw new Error("All variants must have a SKU.");
        }
        if (isNaN(v.stock) || v.stock < 0) {
          throw new Error("Variant stock must be a non-negative integer.");
        }
        if (isNaN(v.priceDeltaPaise)) {
          throw new Error("Variant price delta must be a valid number.");
        }
      }

      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        basePricePaise,
        isActive,
        categoryId: categoryId || null,
        variants: mappedVariants,
        images: images.map((img) => ({
          url: img.url,
          altText: img.altText.trim(),
          isPrimary: img.isPrimary,
          sortOrder: img.sortOrder || 0,
        })),
      };

      const url = isEdit
        ? `/api/v1/admin/products/${initialData.id}`
        : "/api/v1/admin/products";

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
        throw new Error(data.error || "Failed to save product.");
      }

      setSuccessMsg(isEdit ? "Product updated successfully!" : "Product created successfully!");
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred while saving the product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full" style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Messages */}
      {errorMsg && (
        <div className="alert-banner alert-error" role="alert">
          <div>
            <strong>Error:</strong> {errorMsg}
          </div>
        </div>
      )}
      {successMsg && (
        <div className="alert-banner alert-success" role="alert">
          <div>{successMsg}</div>
        </div>
      )}

      {/* Grid for basics */}
      <div className="card p-6 flex flex-col gap-4" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-accent)", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
          {isEdit ? "Edit Product Details" : "Create New Product"}
        </h2>

        {/* Name */}
        <div className="input-group">
          <label className="input-label input-required" htmlFor="prod-name">Product Name</label>
          <input
            id="prod-name"
            type="text"
            className="input-field"
            placeholder="e.g. Premium Silk Jacket"
            value={name}
            onChange={handleNameChange}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Slug */}
        <div className="input-group">
          <label className="input-label input-required" htmlFor="prod-slug">Slug (URL friendly)</label>
          <input
            id="prod-slug"
            type="text"
            className="input-field"
            placeholder="e.g. premium-silk-jacket"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div className="input-group">
          <label className="input-label" htmlFor="prod-desc">Description</label>
          <textarea
            id="prod-desc"
            className="input-field"
            placeholder="Product description and details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Base Price */}
          <div className="input-group">
            <label className="input-label input-required" htmlFor="prod-price">Base Price (INR ₹)</label>
            <input
              id="prod-price"
              type="number"
              step="0.01"
              min="0"
              className="input-field"
              placeholder="e.g. 1499.00"
              value={basePriceRupees}
              onChange={(e) => setBasePriceRupees(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <div className="input-group">
            <label className="input-label" htmlFor="prod-category">Category</label>
            <select
              id="prod-category"
              className="input-field"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center gap-3" style={{ marginTop: "10px" }}>
          <input
            id="prod-active"
            type="checkbox"
            style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--color-accent)" }}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={isSubmitting}
          />
          <label htmlFor="prod-active" className="font-medium" style={{ cursor: "pointer", userSelect: "none" }}>
            Product is Active (Visible in store)
          </label>
        </div>
      </div>

      {/* Variants Section */}
      <div className="card p-6 flex flex-col gap-4" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex justify-between items-center" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-accent)" }}>
            Product Variants
          </h2>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ minHeight: "36px", padding: "4px 12px", fontSize: "13px" }}
            onClick={addVariant}
            disabled={isSubmitting}
          >
            <svg style={{ width: "16px", height: "16px", marginRight: "4px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Variant
          </button>
        </div>

        {variants.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
            No variants created. This product will sell as a single standard unit.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {variants.map((variant, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3"
                style={{
                  backgroundColor: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div className="input-group" style={{ margin: 0, flex: 2 }}>
                  <label className="text-xs font-semibold input-required">SKU</label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ minHeight: "38px", padding: "6px 12px" }}
                    placeholder="e.g. SLK-JKT-S"
                    value={variant.sku}
                    onChange={(e) => updateVariant(index, "sku", e.target.value.toUpperCase())}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="input-group" style={{ margin: 0, flex: 1 }}>
                  <label className="text-xs font-semibold input-required">Stock</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    style={{ minHeight: "38px", padding: "6px 12px" }}
                    value={variant.stock}
                    onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value) || 0)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="input-group" style={{ margin: 0, flex: 1.5 }}>
                  <label className="text-xs font-semibold">Price Delta (INR ₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    style={{ minHeight: "38px", padding: "6px 12px" }}
                    placeholder="e.g. +200 or -100"
                    value={variant.priceDeltaRupees}
                    onChange={(e) => updateVariant(index, "priceDeltaRupees", e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ minHeight: "38px", padding: "0 12px", marginTop: "18px" }}
                  onClick={() => removeVariant(index)}
                  disabled={isSubmitting}
                  title="Remove Variant"
                >
                  <svg style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Images Section */}
      <div className="card p-6 flex flex-col gap-4" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-accent)", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
          Product Images (Max 8)
        </h2>

        {/* Upload Box */}
        {images.length < 8 ? (
          <div
            style={{
              border: "2px dashed var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
              textAlign: "center",
              cursor: isSubmitting || isUploading ? "not-allowed" : "pointer",
              backgroundColor: "rgba(0,0,0,0.1)",
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
            <p className="font-semibold" style={{ fontSize: "14px", marginBottom: "4px" }}>
              {isUploading ? "Uploading..." : "Click or drag image to upload"}
            </p>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
              JPEG, PNG, or WEBP formats only. Max 5MB file size.
            </p>
          </div>
        ) : (
          <p style={{ color: "var(--color-warning)", fontSize: "14px", fontStyle: "italic", textAlign: "center" }}>
            Maximum image limit (8) reached.
          </p>
        )}

        {/* Uploaded Images List */}
        {images.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
            {images.map((img, index) => (
              <div
                key={index}
                className="flex gap-4 p-4"
                style={{
                  backgroundColor: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  alignItems: "center",
                }}
              >
                {/* Thumbnail */}
                <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0, borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="Uploaded thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>

                {/* Details Form */}
                <div className="flex flex-col gap-2" style={{ flexGrow: 1 }}>
                  {/* Alt Text (strictly required) */}
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="text-xs font-semibold input-required">Alt Text (Accessibility requirement)</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ minHeight: "36px", padding: "6px 12px", fontSize: "13px" }}
                      placeholder="e.g. Gold trimmed premium silk jacket model view"
                      value={img.altText}
                      onChange={(e) => updateImage(index, "altText", e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex items-center gap-6" style={{ marginTop: "4px" }}>
                    {/* Primary Image Toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`img-primary-${index}`}
                        checked={img.isPrimary}
                        onChange={(e) => updateImage(index, "isPrimary", e.target.checked)}
                        disabled={isSubmitting}
                        style={{ cursor: "pointer", accentColor: "var(--color-accent)" }}
                      />
                      <label htmlFor={`img-primary-${index}`} className="text-xs font-semibold" style={{ cursor: "pointer", userSelect: "none" }}>
                        Primary Image
                      </label>
                    </div>

                    {/* Sort Order */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">Sort Order:</span>
                      <input
                        type="number"
                        className="input-field"
                        style={{ minHeight: "28px", width: "60px", padding: "2px 6px", fontSize: "12px", margin: 0 }}
                        value={img.sortOrder}
                        onChange={(e) => updateImage(index, "sortOrder", parseInt(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ minHeight: "38px", padding: "0 12px" }}
                  onClick={() => removeImage(index)}
                  disabled={isSubmitting}
                  title="Remove Image"
                >
                  <svg style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-between" style={{ marginTop: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "20px" }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push("/admin/products")}
          disabled={isSubmitting}
          style={{ flex: 1 }}
        >
          Cancel
        </button>

        <button
          type="submit"
          className={`btn btn-primary ${isSubmitting ? "btn-loading" : ""}`}
          disabled={isSubmitting || isUploading}
          style={{ flex: 2 }}
        >
          {isEdit ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
