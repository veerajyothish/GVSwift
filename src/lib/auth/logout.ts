import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Client-side utility to completely clear all session state and redirect to login.
 * Clears:
 *   - Supabase client auth state
 *   - localStorage and sessionStorage keys starting with 'sb-'
 *   - cookies starting with 'sb-' on the client side
 *   - server session cookies via POST /api/v1/auth/logout
 * Subsequently redirects the browser using window.location to bypass Next.js router caches.
 */
export async function performClientLogout() {
  try {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[Logout] Client signOut error:", err);
  }

  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-")) {
        localStorage.removeItem(key);
      }
    }
  } catch {}

  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("sb-")) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {}

  try {
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name && name.startsWith("sb-")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
  } catch {}

  try {
    await fetch("/api/v1/auth/logout", { method: "POST" });
  } catch (err) {
    console.error("[Logout] Server logout error:", err);
  }

  window.location.href = "/login";
}
