import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

// GET /api/v1/wishlist — return all wishlist items for the authenticated user
export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json([], { status: 200 });

  const user = await prisma.user.findUnique({
    where: { supabaseId: session.id },
    select: { id: true },
  });
  if (!user) return NextResponse.json([], { status: 200 });

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    select: { productId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(items);
}

// POST /api/v1/wishlist — toggle a product in/out of the wishlist
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { productId } = body as { productId?: string };

  if (!productId || typeof productId !== 'string') {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: session.id },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId: user.id, productId } },
    });
    return NextResponse.json({ added: false });
  } else {
    await prisma.wishlistItem.create({
      data: { userId: user.id, productId },
    });
    return NextResponse.json({ added: true });
  }
}
