'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/session';

export async function getWishlistProductIds(): Promise<string[]> {
  const session = await getServerSession();
  if (!session) return [];

  const user = await prisma.user.findUnique({
    where: { supabaseId: session.id },
    select: { id: true },
  });
  if (!user) return [];

  const data = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    select: { productId: true },
  });

  return data.map((r) => r.productId);
}

export async function getWishlistedIds(supabaseUid: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUid },
    select: { id: true },
  });
  if (!user) return [];

  const data = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    select: { productId: true },
  });

  return data.map((r) => r.productId);
}

export async function getWishlist(): Promise<string[]> {
  return getWishlistProductIds();
}

export async function toggleWishlist(productId: string): Promise<boolean> {
  const session = await getServerSession();
  if (!session) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { supabaseId: session.id },
    select: { id: true },
  });
  if (!user) throw new Error('User not found');

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId: user.id,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });
    return false;
  } else {
    await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        productId,
      },
    });
    return true;
  }
}
