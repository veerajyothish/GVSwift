'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/session';

export interface ReviewWithUser {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
}

export async function getProductReviews(productId: string): Promise<ReviewWithUser[]> {
  const reviews = await prisma.productReview.findMany({
    where: { productId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    user: {
      name: r.user.name,
      email: r.user.email,
    },
  }));
}

export async function checkUserStatusForReview(productId: string) {
  const session = await getServerSession();
  if (!session) {
    return { isLoggedIn: false, hasPurchased: false };
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: session.id },
    select: { id: true },
  });
  if (!user) {
    return { isLoggedIn: false, hasPurchased: false };
  }

  // Count order items of any status containing the product for this user
  const count = await prisma.order.count({
    where: {
      userId: user.id,
      items: {
        some: {
          productId,
        },
      },
    },
  });

  return { isLoggedIn: true, hasPurchased: count > 0 };
}

export async function submitProductReview(
  productId: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'You must be logged in to leave a review.' };
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: session.id },
      select: { id: true },
    });
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    // Check purchase status
    const count = await prisma.order.count({
      where: {
        userId: user.id,
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (count === 0) {
      return {
        success: false,
        error: 'You must purchase this product before writing a review.',
      };
    }

    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5.' };
    }

    await prisma.productReview.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
      create: {
        userId: user.id,
        productId,
        rating,
        comment: comment.trim() || null,
      },
      update: {
        rating,
        comment: comment.trim() || null,
      },
    });

    return { success: true };
  } catch (err) {
    console.error('[Reviews] Submit error:', err);
    return { success: false, error: 'An unexpected error occurred while saving your review.' };
  }
}
