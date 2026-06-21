import React from "react";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/features/catalog/service";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { Navbar } from "@/components/ui/Navbar";

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }

  if (!product) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <ProductDetailClient product={product} />
    </>
  );
}
