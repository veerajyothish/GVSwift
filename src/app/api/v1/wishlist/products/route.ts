import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json([], { status: 200 });

  const user = await prisma.user.findUnique({
    where: { supabaseId: session.id },
    select: { id: true },
  });
  if (!user) return NextResponse.json([], { status: 200 });

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    select: { productId: true },
    orderBy: { createdAt: 'desc' },
  });

  const productIds = wishlistItems.map(item => item.productId);

  if (productIds.length === 0) {
    return NextResponse.json([]);
  }

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

  const products = dbProducts.map((p) => ({
    ...p,
    avgRating:
      ratingAggregates.find((r) => r.productId === p.id)?._avg?.rating ?? null,
  }));

  // Sort products to match the order of wishlistItems (descending by createdAt)
  const sortedProducts = productIds.map(id => products.find(p => p.id === id)).filter(Boolean);

  return NextResponse.json(sortedProducts);
}
