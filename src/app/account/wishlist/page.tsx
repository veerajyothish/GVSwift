import React from 'react';
import { requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Metadata } from 'next';
import ProductCard from '@/components/ui/ProductCard';
import { Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Wishlist — GVSwift',
};

export default async function WishlistPage() {
  const user = await requireUser();

  // Look up the Prisma user from the Supabase session
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });

  if (!dbUser) {
    return (
      <div className="flex flex-col gap-5">
        <p className="text-secondary">Could not load wishlist. Please try again.</p>
      </div>
    );
  }

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: 'desc' },
    select: { productId: true },
  });

  const productIds = wishlistItems.map((item) => item.productId);

  let products: Array<{
    id: string;
    name: string;
    slug: string;
    basePricePaise: number;
    avgRating?: number | null;
    categoryId?: string | null;
    images: Array<{ url: string; altText: string | null; isPrimary: boolean }>;
    variants: Array<{ id: string; sku: string; stock: number; priceDeltaPaise: number }>;
  }> = [];

  if (productIds.length > 0) {
    const [dbProducts, ratingAggregates] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
          variants: true,
        },
      }),
      prisma.productReview.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
      }),
    ]);

    // Preserve wishlist order (most recently added first)
    products = productIds
      .map((id) => {
        const p = dbProducts.find((d) => d.id === id);
        if (!p) return null;
        const rating = ratingAggregates.find((r) => r.productId === p.id);
        return { ...p, avgRating: rating?._avg?.rating ?? null };
      })
      .filter(Boolean) as typeof products;
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="mb-24">
        <h1
          className="text-3xl font-semibold mb-4 text-primary"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          My Wishlist
        </h1>
        <p className="text-secondary">Your saved items and favourites.</p>
      </header>

      {products.length === 0 ? (
        <div
          className="card p-8 flex flex-col items-center justify-center text-center gap-4"
          style={{ padding: '40px' }}
        >
          <Heart size={48} className="text-secondary opacity-30" />
          <p className="text-secondary">Your wishlist is currently empty.</p>
          <Link href="/products">
            <Button variant="primary">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div
          className="product-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '24px',
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} initialWishlisted={true} />
          ))}
        </div>
      )}
    </div>
  );
}
