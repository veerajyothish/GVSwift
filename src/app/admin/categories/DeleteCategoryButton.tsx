"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteCategoryButtonProps {
  id: string;
  name: string;
  productCount: number;
}

export default function DeleteCategoryButton({ id, name, productCount }: DeleteCategoryButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (productCount > 0) {
      setError(
        `Cannot delete — ${productCount} product${productCount !== 1 ? "s are" : " is"} assigned to this category. Reassign them first.`
      );
      return;
    }
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;

    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to delete category.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <button
        id={`delete-category-${id}`}
        onClick={handleDelete}
        disabled={isDeleting}
        className="btn btn-sm btn-danger"
      >
        {isDeleting ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <div
          role="alert"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "var(--color-error-bg)",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-error)",
            padding: "12px 16px",
            fontSize: "13px",
            fontWeight: 500,
            maxWidth: "360px",
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: "12px", background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "inherit" }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
