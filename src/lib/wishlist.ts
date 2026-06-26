/**
 * Wishlist helpers — all reads/writes go through the /api/v1/wishlist route
 * so they use the Prisma WishlistItem model (the single source of truth).
 * The old raw Supabase `wishlists` table is no longer used.
 */

export async function getWishlist(): Promise<string[]> {
  const res = await fetch('/api/v1/wishlist', { credentials: 'include' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.map((item: { productId: string }) => item.productId) : [];
}

export async function toggleWishlist(productId: string): Promise<boolean> {
  const res = await fetch('/api/v1/wishlist', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) throw new Error('Wishlist toggle failed');
  const data = await res.json();
  return data.added as boolean;
}
