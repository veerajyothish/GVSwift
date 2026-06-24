/**
 * middleware.ts — Next.js edge middleware
 *
 * Responsibilities (in execution order):
 *  1. Refresh Supabase auth tokens so sessions don't expire mid-request
 *  2. HTTPS redirect (only in production)
 *  3. Security headers (base set — TICKET-902 will add the full CSP)
 *
 * NOTE: Rate limiting (TICKET-901) was removed from here because the
 * in-memory `global`-based store is incompatible with Next.js edge runtime.
 * Rate limiting must be implemented using an edge-compatible store (e.g. Upstash Redis).
 *
 * Middleware runs on every matched route (see `config.matcher` below).
 * Keep it lean — no DB queries, no heavy computation here.
 */

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ── 1. Supabase auth token refresh ────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session and check authentication
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Admin landing redirect
  if (user && user.user_metadata?.role === "ADMIN" && pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 2. Protected routes enforcement
  const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/account") || pathname.startsWith("/checkout");
  const isLoginPage = pathname === "/login";

  if (isProtectedRoute && !user && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── 2. HTTPS redirect (production only) ───────────────────────────────
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const httpsUrl = `https://${request.headers.get("host")}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(httpsUrl, { status: 301 });
  }

  // ── 3. Base security headers (TICKET-902 expands to full CSP) ─────────
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml (public assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
