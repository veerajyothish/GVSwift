'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getWishlist, toggleWishlist as toggleWishlistApi } from '@/lib/wishlist';

interface WishlistContextType {
  wishlistIds: Set<string>;
  wishlistedIds: string[];
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const wishlistedIds = Array.from(wishlistIds);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchWishlist = useCallback(async () => {
    try {
      const idsList = await getWishlist();
      setWishlistIds(new Set(idsList));
    } catch {
      console.warn('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [pathname, fetchWishlist]);

  function isWishlisted(productId: string) {
    return wishlistIds.has(productId);
  }

  async function toggleWishlist(productId: string) {
    // Check session by attempting the toggle — if 401 comes back, redirect to login
    const isCurrentlyAdded = wishlistIds.has(productId);

    // Optimistic update
    const newIds = new Set(wishlistIds);
    if (isCurrentlyAdded) {
      newIds.delete(productId);
    } else {
      newIds.add(productId);
    }
    setWishlistIds(newIds);

    try {
      const added = await toggleWishlistApi(productId);
      if (added !== !isCurrentlyAdded) {
        // Server state differs — reconcile
        await fetchWishlist();
      }
    } catch (err: unknown) {
      // If unauthenticated, redirect to login
      if (err instanceof Error && err.message.includes('401')) {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        router.push(`/login?next=${returnUrl}`);
        return;
      }
      // Revert optimistic update on other errors
      setWishlistIds(new Set(wishlistIds));
    }
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistedIds,
        loading,
        isWishlisted,
        toggleWishlist,
        refreshWishlist: fetchWishlist,
        refresh: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
