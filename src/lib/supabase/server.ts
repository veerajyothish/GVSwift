/**
 * lib/supabase/server.ts — Supabase client for Server Components and Route Handlers
 *
 * Uses @supabase/ssr's createServerClient with Next.js cookies() integration.
 * Every server-side request gets its own client instance; cookies are read
 * from the incoming request and written back to the response so the auth
 * token stays fresh.
 *
 * Cookie security (docs/03-Security-Access.md §1):
 *   - HttpOnly: set by Supabase SSR library (prevents JS access)
 *   - Secure: enforced in production via cookie options override below
 *   - SameSite=Lax: set explicitly below
 *
 * This is NOT the admin client — it uses the anon key + RLS. For privileged
 * operations that bypass RLS (e.g., admin Storage writes) use the service
 * role key via createSupabaseAdminClient() — SERVER ONLY.
 */

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

/** Shared secure cookie defaults — HttpOnly/Secure/SameSite=Lax */
const SECURE_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...SECURE_COOKIE_OPTIONS,
                ...options,
                // Never allow these to be overridden by Supabase defaults
                httpOnly: true,
                sameSite: "lax",
              })
            );
          } catch {
            // setAll can throw in Server Components (read-only context).
            // The middleware handles token refreshes in that case.
          }
        },
      },
    }
  );
}

/**
 * Supabase admin client — uses service role key, bypasses RLS.
 * SERVER ONLY. Never import in client components or pass to the browser.
 * Use only for privileged operations (e.g., Storage writes, admin queries).
 */
export function createSupabaseAdminClient() {
  // Belt-and-suspenders guard — the real protection is never importing
  // this function in a 'use client' file.
  if (typeof window !== "undefined") {
    throw new Error(
      "[Security] createSupabaseAdminClient must only be called server-side"
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
