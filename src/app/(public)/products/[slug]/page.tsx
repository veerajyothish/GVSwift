import React from "react";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/features/catalog/service";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { Navbar } from "@/components/ui/Navbar";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/Breadcrumb";
import ProductCard from "@/components/ui/ProductCard";
import { getServerSession } from "@/lib/auth/session";
import { getWishlistedIds } from "@/lib/wishlist";

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

  const [session, relatedProducts] = await Promise.all([
    getServerSession(),
    product.categoryId ? getRelatedProducts(product.categoryId, product.id, 4) : [],
  ]);

  const wishlistedIds = session ? await getWishlistedIds(session.id) : [];

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Shop", href: "/products" },
  ];
  if (product.category) {
    breadcrumbItems.push({
      label: product.category.name,
      href: `/products?categoryId=${product.category.id}`,
    });
  }
  breadcrumbItems.push({ label: product.name });

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 20px 0" }}>
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <ProductDetailClient product={product} />
      
      {relatedProducts.length > 0 && (
        <section style={{ maxWidth: "1200px", margin: "40px auto 48px", padding: "0 20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px", fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
            Related Products
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "24px"
          }}>
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                initialWishlisted={wishlistedIds.includes(p.id)}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
