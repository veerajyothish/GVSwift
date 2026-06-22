/**
 * middleware.ts — Next.js edge middleware
 *
 * Responsibilities (in execution order):
 *  1. Refresh Supabase auth tokens so sessions don't expire mid-request
 *  2. HTTPS redirect (only in production)
 *  3. Security headers (base set — TICKET-902 will add the full CSP)
 *  4. Rate limiting hook point — TICKET-901 implements the real limiting
 *
 * Middleware runs on every matched route (see `config.matcher` below).
 * Keep it lean — no DB queries, no heavy computation here.
 */

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkRateLimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  const isApiV1Route = request.nextUrl.pathname.startsWith("/api/v1/");

  if (isApiV1Route && process.env.NODE_ENV !== "test") {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip =
      forwardedFor?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const rateLimit = await checkRateLimit(`api:${ip}`, {
      limit: 60,
      windowSeconds: 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ── 1. Supabase auth token refresh ────────────────────────────────────
  // createServerClient here refreshes the token and writes updated cookies
  // back to the response. This is required for @supabase/ssr to work
  // correctly with Next.js App Router.
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

  // Refresh session (don't check result here — guards.ts does auth enforcement)
  await supabase.auth.getUser();

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
