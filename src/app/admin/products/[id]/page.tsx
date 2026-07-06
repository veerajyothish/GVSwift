import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById, listCategories, listShops } from "@/features/catalog/repository";
import ProductForm from "../components/ProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProductPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch product by ID (include inactive), all categories and active shops
  const [product, categories, shops] = await Promise.all([
    getProductById(id, true),
    listCategories(),
    listShops({ isActive: true }),
  ]);

  if (!product) {
    notFound();
  }

  // Format dates/optional fields for client compatibility
  const formattedProduct = {
    ...product,
    shopId: product.shopId || "",
  };

  return (
    <div className="container-sm flex flex-col gap-4">
      {/* Back button and title */}
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/products"
          className="flex items-center gap-2 text-secondary text-sm font-medium"
        >
          <svg className="icon-xs" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Product Catalog
        </Link>
        <h1 className="text-2xl font-bold text-accent mt-4">
          Edit Product: <span className="text-primary">{product.name}</span>
        </h1>
      </div>

      {/* Shared form pre-filled */}
      <ProductForm initialData={formattedProduct} categories={categories} shops={shops} />
    </div>
  );
}
