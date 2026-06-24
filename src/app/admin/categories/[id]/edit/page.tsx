import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditCategoryForm from "./EditCategoryForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Category — GVSwift Admin",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Edit Category</h1>
          <p className="admin-page-subtitle">Update the name or slug for this category.</p>
        </div>
      </div>

      <div style={{ maxWidth: "560px" }}>
        <EditCategoryForm
          id={category.id}
          initialName={category.name}
          initialSlug={category.slug}
        />
      </div>
    </div>
  );
}
