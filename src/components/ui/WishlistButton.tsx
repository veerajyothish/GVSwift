'use client';
import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toggleWishlist } from '@/lib/wishlist-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

interface Props {
  productId: string;
  initialWishlisted: boolean;
}

export default function WishlistButton({ productId, initialWishlisted }: Props) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Sync state with prop updates (e.g. from parent re-renders)
  useEffect(() => {
    setWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    setLoading(true);
    const added = await toggleWishlist(productId);
    setWishlisted(added);
    setLoading(false);
    
    // Refresh page data so other parts of the UI (e.g. wishlist count or wishlist page list) stay in sync
    router.refresh();
  };

  return (
    <button
      onClick={handleClick}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      disabled={loading}
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'rgba(253, 250, 245, 0.9)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        border: 'none',
        cursor: loading ? 'wait' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        transform: loading ? 'scale(0.9)' : 'scale(1)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <Heart
        size={16}
        style={{
          fill: wishlisted ? '#6B1E2E' : 'none',
          stroke: wishlisted ? '#6B1E2E' : '#9B9B9B',
          transition: 'fill 0.2s ease, stroke 0.2s ease',
        }}
      />
    </button>
  );
}
