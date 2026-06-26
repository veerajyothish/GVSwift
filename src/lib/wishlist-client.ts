import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export async function toggleWishlist(productId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('wishlists')
      .delete()
      .eq('product_id', productId)
      .eq('user_id', session.user.id);
    return false; // removed
  } else {
    await supabase
      .from('wishlists')
      .insert({ product_id: productId, user_id: session.user.id });
    return true; // added
  }
}
