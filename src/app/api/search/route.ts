import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (q.length < 2) return NextResponse.json({ products: [] });

  // PostgreSQL Full Text Search raw query
  const rawResults = await withRetry(() =>
    prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Product"
      WHERE search_vector @@ websearch_to_tsquery('english', ${q})
      AND "isActive" = true
      LIMIT 8
    `
  );

  const matchedIds = rawResults.map((r) => r.id);

  const products = await withRetry(() =>
    prisma.product.findMany({
      where: {
        id: { in: matchedIds },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        basePricePaise: true,
        images: {
          where: { isPrimary: true },
          select: { url: true },
          take: 1,
        },
      },
    })
  );

  return NextResponse.json({ products }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

