import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCachedProductBySlug, getCachedRelatedProducts } from "@/features/catalog/cached-queries";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { Navbar } from "@/components/ui/Navbar";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/Breadcrumb";
import ProductCard from "@/components/ui/ProductCard";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

function RelatedProductsSkeleton() {
  return (
    <div className="product-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="sk-product-card">
          <div className="sk sk-img-3-4" style={{ borderRadius: 0 }} />
          <div className="sk-product-card-body">
            <span className="sk sk-h12 sk-w40" />
            <span className="sk sk-h16 sk-w100" />
            <span className="sk sk-h20 sk-w30" style={{ marginTop: "4px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

async function RelatedProducts({
  categoryId,
  excludeId,
}: {
  categoryId: string;
  excludeId: string;
}) {
  const related = await getCachedRelatedProducts(categoryId, excludeId, 4);
  if (!related.length) return null;

  return (
    <>
      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          paddingTop: "56px",
          marginBottom: "36px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(24px, 3vw, 32px)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--color-text-primary)",
            marginBottom: "4px",
          }}
        >
          You May Also Like
        </h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
          More from the collection
        </p>
      </div>
      <div className="product-grid animate-in">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  // Use cached query — 60s revalidation
  const product = await getCachedProductBySlug(slug);

  if (!product) notFound();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Collection", href: "/products" },
  ];
  if (product.category) {
    breadcrumbItems.push({
      label: product.category.name,
      href: `/products?categoryId=${product.category.id}`,
    });
  }
  breadcrumbItems.push({ label: product.name });

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px 24px 0", width: "100%" }}>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <ProductDetailClient product={product} />

      {/* Related products — streams in independently via Suspense */}
      {product.categoryId && (
        <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 72px", width: "100%" }}>
          <Suspense fallback={<RelatedProductsSkeleton />}>
            <RelatedProducts categoryId={product.categoryId} excludeId={product.id} />
          </Suspense>
        </section>
      )}
    </div>
  );
}