"use client";

/**
 * lib/supabase/client.ts — Supabase browser client singleton
 *
 * Returns a singleton browser-side client. Uses the anon key (safe to
 * expose; all data access is RLS-protected server-side).
 *
 * Do NOT use this for server actions or route handlers — use
 * lib/supabase/server.ts there.
 *
 * Marked "use client" to ensure this file is never included in server
 * bundles, which would be a no-op but confusing.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}
