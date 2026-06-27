import React from "react";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/features/catalog/service";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { Navbar } from "@/components/ui/Navbar";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/Breadcrumb";
import ProductCard from "@/components/ui/ProductCard";

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

  const relatedProducts = product.categoryId
    ? await getRelatedProducts(product.categoryId, product.id, 4)
    : [];

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
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* PDF p.4/5: thin navbar, logo left, nav center, icons right */}
      <Navbar />

      {/* Breadcrumb — PDF p.4: "COLLECTION › OUTERWEAR" in small caps */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px 24px 0",
          width: "100%",
        }}
      >
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Main product layout — PDF p.4/5: large image left (sticky), info right */}
      <ProductDetailClient product={product} />

      {/* ── Related Products ─────────────────────────────────────────────── */}
      {/* PDF p.6: related items shown as standard product grid cards below */}
      {relatedProducts.length > 0 && (
        <section
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px 72px",
            width: "100%",
          }}
        >
          {/* Divider */}
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
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-secondary)",
              }}
            >
              More from the collection
            </p>
          </div>

          <div className="product-grid">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}