import React from "react";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wishlist — GVSwift",
};

export default async function WishlistPage() {
  const user = await requireUser();

  // Fetch wishlist items including product details, variants, and images
  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          images: {
            orderBy: [
              { isPrimary: "desc" },
              { sortOrder: "asc" },
            ],
          },
          variants: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch average rating for each product using Prisma groupBy and _avg
  const productIds = wishlistItems.map((item) => item.productId);
  let ratingAggregates: Array<{ productId: string; _avg: { rating: number | null } }> = [];

  if (productIds.length > 0) {
    const rawAggregates = await prisma.productReview.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
    });
    ratingAggregates = rawAggregates.map(r => ({
      productId: r.productId,
      _avg: { rating: r._avg?.rating ?? null }
    }));
  }

  // Format and match ratings
  const itemsWithRatings = wishlistItems.map((item) => {
    const match = ratingAggregates.find((r) => r.productId === item.productId);
    return {
      ...item,
      avgRating: match?._avg.rating ?? null,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <header className="mb-24">
        <h1 className="text-3xl font-semibold mb-4 text-primary" style={{ fontFamily: "var(--font-heading)" }}>
          My Wishlist
        </h1>
        <p className="text-secondary">
          Your saved items and favorites.
        </p>
      </header>

      {itemsWithRatings.length === 0 ? (
        <div className="card p-8 flex flex-col items-center justify-center text-center gap-4" style={{ padding: "40px" }}>
          <p className="text-secondary">Your wishlist is currently empty.</p>
          <Link href="/products">
            <Button variant="primary">Continue Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "24px" }}>
          {itemsWithRatings.map((item) => {
            const product = item.product;
            const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
            const imageUrl = primaryImage?.url || "/fashion_product_mockup.png";
            const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
            const isOutOfStock = totalStock === 0;
            const formattedPrice = `₹${(product.basePricePaise / 100).toLocaleString("en-IN")}`;

            return (
              <Card key={item.id} interactive className="card-product" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div className="card-product-image-container" style={{ position: "relative", width: "100%", aspectRatio: "1", overflow: "hidden" }}>
                  <Image
                    src={imageUrl}
                    alt={primaryImage?.altText || product.name}
                    className="card-product-image"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    style={{ objectFit: "cover" }}
                  />
                  {isOutOfStock && (
                    <span className="product-card-badge-error">
                      OUT OF STOCK
                    </span>
                  )}
                </div>

                <div className="card-product-content" style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                  <div>
                    <h3 className="card-product-title">{product.name}</h3>
                    {item.avgRating && (
                      <div
                        className="product-rating"
                        style={{
                          fontFamily: "var(--font-body), sans-serif",
                          color: "var(--color-primary)",
                          fontSize: "13px",
                          fontWeight: 500,
                          marginTop: "4px",
                        }}
                      >
                        {item.avgRating.toFixed(1)} ★
                      </div>
                    )}
                    <div className="card-product-price-row" style={{ marginTop: "8px" }}>
                      <span className="card-product-price">{formattedPrice}</span>
                    </div>
                  </div>

                  <div className="card-product-btn-row" style={{ marginTop: "16px" }}>
                    <Link href={`/products/${product.slug}`} className="w-full" style={{ display: "block" }}>
                      <Button variant={isOutOfStock ? "secondary" : "primary"} style={{ width: "100%" }} disabled={isOutOfStock}>
                        {isOutOfStock ? "View Out of Stock" : "Select Options"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
