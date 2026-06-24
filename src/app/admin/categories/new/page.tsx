"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(value.toLowerCase().replace(/[^\w-]/g, "-"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Category name is required."); return; }
    if (!slug.trim()) { setError("Slug is required."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create category."); return; }
      router.push("/admin/categories");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">New Category</h1>
          <p className="admin-page-subtitle">Add a new product category to your catalog.</p>
        </div>
      </div>

      <div style={{ maxWidth: "560px" }}>
        <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-5">
          <div className="admin-settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
            <label htmlFor="category-name" className="admin-settings-label">
              Category Name <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <input
              id="category-name"
              type="text"
              className="input-field"
              style={{ width: "100%" }}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Summer Collection"
              required
            />
          </div>

          <div className="admin-settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
            <label htmlFor="category-slug" className="admin-settings-label">
              Slug <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <input
              id="category-slug"
              type="text"
              className="input-field"
              style={{ width: "100%" }}
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g. summer-collection"
              required
            />
            <span className="admin-settings-help">
              Auto-generated from name. Used in URLs: /products?category=<strong>{slug || "slug"}</strong>
            </span>
          </div>

          {error && (
            <div style={{ background: "var(--color-error-bg)", border: "1px solid var(--color-error)", borderRadius: "var(--radius-md)", padding: "10px 14px", color: "var(--color-error)", fontSize: "13px", fontWeight: 500 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.push("/admin/categories")} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
