import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (q.length < 2) return NextResponse.json({ products: [] });
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
      isActive: true,
    },
    select: { id: true, name: true, slug: true },
    take: 8,
  });
  return NextResponse.json({ products });
}
