import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export async function getWishlist(): Promise<string[]> {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.from('wishlists').select('product_id');
  return data?.map((r) => r.product_id) ?? [];
}

export async function toggleWishlist(productId: string): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    await supabase.from('wishlists').delete().eq('product_id', productId);
    return false;
  } else {
    await supabase.from('wishlists').insert({ product_id: productId });
    return true;
  }
}
