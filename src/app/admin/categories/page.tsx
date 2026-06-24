import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";
import DeleteCategoryButton from "./DeleteCategoryButton";

export const metadata: Metadata = {
  title: "Category Management — GVSwift Admin",
};

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Categories</h1>
          <p className="admin-page-subtitle">
            {categories.length} categor{categories.length !== 1 ? "ies" : "y"} total
          </p>
        </div>
        <Link href="/admin/categories/new" className="btn btn-primary">
          <svg style={{ marginRight: "6px", width: "16px", height: "16px", verticalAlign: "middle" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗂️</div>
          <h3 className="empty-state-title">No categories yet</h3>
          <p className="empty-state-text">Add your first category to organise your product catalog.</p>
          <Link href="/admin/categories/new" className="btn btn-primary" style={{ marginTop: "20px", display: "inline-flex" }}>
            Add Category
          </Link>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" aria-label="Category list">
            <thead>
              <tr>
                <th scope="col">Category Name</th>
                <th scope="col">Slug</th>
                <th scope="col">Products</th>
                <th scope="col" style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="admin-table-row">
                  <td className="admin-table-cell" style={{ fontWeight: 500 }}>
                    {cat.name}
                  </td>
                  <td className="admin-table-cell admin-table-cell-secondary">
                    <code style={{ fontSize: "12px", background: "var(--color-bg)", padding: "2px 6px", borderRadius: "4px" }}>
                      {cat.slug}
                    </code>
                  </td>
                  <td className="admin-table-cell">
                    {cat._count.products}
                  </td>
                  <td className="admin-table-cell" style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <Link
                        href={`/admin/categories/${cat.id}/edit`}
                        className="btn btn-sm btn-outline"
                        id={`edit-category-${cat.id}`}
                      >
                        Edit
                      </Link>
                      <DeleteCategoryButton
                        id={cat.id}
                        name={cat.name}
                        productCount={cat._count.products}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
