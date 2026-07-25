import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ui/ProductCard";
import Link from "next/link";
import { Metadata } from "next";

const ALLOWED_SLUGS = ["women", "men", "accessories", "gifts-decor"];

export function generateStaticParams() {
  return ALLOWED_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  if (!ALLOWED_SLUGS.includes(slug)) return {};
  
  const category = await prisma.category.findUnique({ where: { slug } });
  
  return {
    title: `${category?.name || slug} | GVSwift`,
    description: `Shop our ${category?.name || slug} collection at GVSwift.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  if (!ALLOWED_SLUGS.includes(slug)) {
    notFound();
  }

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    // If the category isn't in DB yet but is in the allowlist
    return (
      <div className="homepage-wrapper min-h-screen flex flex-col bg-default">
        <main id="main-content" className="container-lg flex-1" style={{ padding: "60px 20px", textAlign: "center" }}>
          <h1 className="text-3xl font-semibold mb-4 text-primary" style={{ fontFamily: "var(--font-heading)", textTransform: "capitalize" }}>
            {slug.replace("-", " ")}
          </h1>
          <p className="text-secondary">{slug.replace("-", " ")} collection coming soon</p>
        </main>
      </div>
    );
  }

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, isActive: true },
    include: {
      variants: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  return (
    <div className="homepage-wrapper min-h-screen flex flex-col bg-default">
      <main id="main-content" className="container-lg flex-1" style={{ padding: "60px 20px" }}>
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-semibold mb-4 text-primary" style={{ fontFamily: "var(--font-heading)" }}>
            {category.name}
          </h1>
          <p className="text-secondary max-w-2xl mx-auto">
            Explore our latest {category.name.toLowerCase()} collection.
          </p>
        </header>

        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p className="text-secondary mb-6">{category.name} collection coming soon</p>
            <Link href="/products" className="btn btn-primary btn-premium">
              Shop All Products
            </Link>
          </div>
        ) : (
          <div className="product-grid animate-in" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "24px"
          }}>
            {products.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={category.name}
                initialWishlisted={false}
                priority={idx < 4}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
