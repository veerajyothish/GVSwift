import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/ui/Navbar";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop by Category",
  description: "Browse GVSwift products by category.",
};

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany(),
    prisma.product.findMany({
      select: { categoryId: true },
      where: { isActive: true },
    }),
  ]);

  const categoryCounts = products.reduce((acc, p) => {
    if (p.categoryId) {
      acc[p.categoryId] = (acc[p.categoryId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const categoriesWithCount = categories.map((category) => ({
    ...category,
    _count: {
      products: categoryCounts[category.id] || 0,
    },
  }));

  const getCategoryImage = (slug: string) => {
    switch (slug) {
      case "apparel":
        return "/structured_wool_blazer.png";
      case "footwear":
        return "/premium_footwear.png";
      default:
        return "/silks_satins.png";
    }
  };

  return (
    <div className="homepage-wrapper min-h-screen flex flex-col bg-default">
      <Navbar />

      <main id="main-content" className="container-lg flex-1" style={{ padding: "60px 20px" }}>
        <header className="mb-12">
          <h1 className="text-3xl font-semibold mb-4 text-primary" style={{ fontFamily: "var(--font-heading)" }}>
            Shop by Category
          </h1>
          <p className="text-secondary">
            Browse our curated collections of premium fashion essentials.
          </p>
        </header>

        {categoriesWithCount.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p className="text-secondary">No categories found. Check back soon!</p>
          </div>
        ) : (
          <div
            className="category-grid"
            style={{
              display: "grid",
              gap: "24px",
            }}
          >
            {categoriesWithCount.map((category) => {
              const image = getCategoryImage(category.slug);
              const count = category._count.products;

              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  style={{ display: "block", textDecoration: "none" }}
                >
                  <Card
                    interactive
                    className="card-interactive"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ position: "relative", width: "100%", aspectRatio: "4/5" }}>
                      <Image
                        src={image}
                        alt={category.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <h2
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: "20px",
                          color: "var(--color-primary)",
                          margin: 0,
                        }}
                      >
                        {category.name}
                      </h2>
                      <span className="text-sm text-secondary">
                        {count} {count === 1 ? "Product" : "Products"}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Grid media queries for responsiveness */}
      <style>{`
        .category-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        @media (min-width: 768px) {
          .category-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .category-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
