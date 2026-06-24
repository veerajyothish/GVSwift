"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

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
      const res = await fetch("/api/v1/wishlist");
      if (res.status === 401) {
        setWishlistIds(new Set());
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const ids = new Set<string>(data.items.map((item: { productId: string }) => item.productId));
        setWishlistIds(ids);
      }
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
      const method = isCurrentlyAdded ? "DELETE" : "POST";
      const res = await fetch("/api/v1/wishlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (res.status === 401) {
        // Revert optimistic update
        const revertedIds = new Set(wishlistIds);
        setWishlistIds(revertedIds);
        
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        router.push(`/login?next=${returnUrl}`);
        return;
      }

      if (!res.ok) {
        // Revert optimistic update on failure
        const revertedIds = new Set(wishlistIds);
        setWishlistIds(revertedIds);
        console.error("Failed to update wishlist on server");
      }
    } catch {
      // Revert optimistic update on network error
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
