"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getWishlist, toggleWishlist as toggleWishlistApi } from "@/lib/wishlist";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface WishlistContextType {
  wishlistIds: Set<string>;
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  async function fetchWishlist() {
    try {
      const idsList = await getWishlist();
      setWishlistIds(new Set(idsList));
    } catch {
      console.warn("Failed to fetch wishlist client-side");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWishlist();
  }, [pathname]); // Refresh on page changes to sync correctly

  function isWishlisted(productId: string) {
    return wishlistIds.has(productId);
  }

  async function toggleWishlist(productId: string) {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/login?next=${returnUrl}`);
      return;
    }

    // Optimistic update
    const isCurrentlyAdded = wishlistIds.has(productId);
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
        // Reconcile if server state is different
        await fetchWishlist();
      }
    } catch {
      // Revert optimistic update
      const revertedIds = new Set(wishlistIds);
      setWishlistIds(revertedIds);
    }
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        loading,
        isWishlisted,
        toggleWishlist,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
