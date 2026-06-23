import React from "react";
import Link from "next/link";
import { listCategories } from "@/features/catalog/repository";
import ProductForm from "../components/ProductForm";

export default async function AdminNewProductPage() {
  const categories = await listCategories();

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
          Add New Product
        </h1>
      </div>

      {/* Shared form */}
      <ProductForm categories={categories} />
    </div>
  );
}
