/**
 * lib/auth/session.ts — Server-side session primitives
 *
 * getServerSession() returns the verified Supabase Auth user from the server.
 * It calls supabase.auth.getUser() which validates the JWT with Supabase's
 * servers on every call — this is intentional; it's the only way to be sure
 * the token hasn't been revoked. Never use getSession() for auth decisions
 * (it reads from the cookie without server-side verification).
 *
 * Returns null if the user is not authenticated or the token is invalid.
 *
 * Callers that need to enforce authentication use requireUser() or
 * requireAdmin() from lib/auth/guards.ts.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cache } from "react";

/**
 * Returns the verified Supabase Auth user for the current request.
 * Null if unauthenticated or token invalid.
 *
 * Always calls getUser() (not getSession()) to validate with Supabase's
 * servers — see https://supabase.com/docs/guides/auth/server-side/nextjs
 * Wrapped in React cache to memoize the request per-render-cycle.
 */
export const getServerSession = cache(async (): Promise<SupabaseUser | null> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
});

/**
 * Returns true if the current request has a valid Supabase session.
 * Convenience wrapper used in middleware/layout checks that only
 * need a boolean (not the user object).
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerSession();
  return user !== null;
}
