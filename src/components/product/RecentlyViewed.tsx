"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { ProductWithVariantsAndImages } from "@/features/catalog/types";

export function RecentlyViewed({ excludeProductId }: { excludeProductId?: string }) {
  const [products, setProducts] = useState<ProductWithVariantsAndImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
      }
      return null;
    };

    const cookieVal = getCookie("recently_viewed");
    if (!cookieVal) {
      setLoading(false);
      return;
    }

    let ids = cookieVal.split(",").filter(Boolean);
    if (excludeProductId) {
      ids = ids.filter(id => id !== excludeProductId);
    }

    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch product details for these IDs
    fetch(`/api/v1/products?ids=${ids.join(",")}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.products) {
          // Sort products to match the order of IDs in the cookie
          const sorted = data.products.sort((a: ProductWithVariantsAndImages, b: ProductWithVariantsAndImages) => {
            return ids.indexOf(a.id) - ids.indexOf(b.id);
          });
          setProducts(sorted);
        }
      })
      .catch(err => console.error("Failed to load recently viewed products:", err))
      .finally(() => setLoading(false));
  }, [excludeProductId]);

  if (loading || products.length === 0) return null;

  return (
    <section className="recently-viewed-section" style={{ marginTop: "48px", paddingTop: "32px", borderTop: "1px solid var(--color-border)" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "20px" }}>
        Recently Viewed Products
      </h2>
      <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
        {products.map((product) => {
          const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
          const imageUrl = primaryImage?.url || "/fashion_product_mockup.png";
          const formattedPrice = `₹${(product.basePricePaise / 100).toLocaleString("en-IN")}`;
          
          return (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <Card interactive className="card-product" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ position: "relative", width: "100%", aspectRatio: "1", overflow: "hidden" }}>
                  <Image
                    src={imageUrl}
                    alt={primaryImage?.altText || product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="card-product-content" style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 400, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                      {product.name}
                    </h3>
                    {product.avgRating && (
                      <div
                        className="product-rating"
                        style={{
                          fontFamily: "var(--font-body), sans-serif",
                          color: "var(--color-primary)",
                          fontSize: "12px",
                          fontWeight: 500,
                          marginBottom: "4px",
                        }}
                      >
                        {product.avgRating.toFixed(1)} ★
                      </div>
                    )}
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-primary)" }}>
                      {formattedPrice}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
