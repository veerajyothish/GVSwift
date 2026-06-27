/**
 * /account/wishlist
 * PDF: standard 4-col product grid, heart icon on cards, empty state with heart icon.
 */
import React from "react";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ui/ProductCard";

export const metadata: Metadata = { title: "My Wishlist | GVSwift" };

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  basePricePaise: number;
  avgRating?: number | null;
  categoryId?: string | null;
  images: Array<{ url: string; altText: string | null; isPrimary: boolean }>;
  variants: Array<{ id: string; sku: string; stock: number; priceDeltaPaise: number }>;
}

export default async function WishlistPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: wishlistItems } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const productIds = wishlistItems?.map((item) => item.product_id) ?? [];

  let products: WishlistProduct[] = [];
  if (productIds.length > 0) {
    const [dbProducts, ratingAggregates] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
          variants: true,
        },
      }),
      prisma.productReview.groupBy({
        by: ["productId"],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
      }),
    ]);
    products = dbProducts.map((p) => ({
      ...p,
      avgRating:
        ratingAggregates.find((r) => r.productId === p.id)?._avg?.rating ?? null,
    }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <header
        style={{
          paddingBottom: "20px",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "8px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(28px, 4vw, 36px)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--color-accent)",
            marginBottom: "8px",
          }}
        >
          My Wishlist
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
          {products.length === 0
            ? "Your saved items will appear here."
            : `${products.length} saved item${products.length !== 1 ? "s" : ""}`}
        </p>
      </header>

      {/* Empty state */}
      {products.length === 0 ? (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "72px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {/* Heart icon */}
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "22px",
              fontStyle: "italic",
              color: "var(--color-text-primary)",
            }}
          >
            Your wishlist is empty
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-text-secondary)",
              maxWidth: "320px",
              lineHeight: 1.6,
            }}
          >
            Save items you love by tapping the heart icon on any product.
          </p>
          <Link
            href="/products"
            className="btn btn-primary btn-premium"
            style={{ marginTop: "8px" }}
          >
            Browse Collection
          </Link>
        </div>
      ) : (
        /* Product grid — same 4-col grid as catalog, hearts show as wishlisted */
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              initialWishlisted={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}