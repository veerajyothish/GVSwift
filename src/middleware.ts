/**
 * middleware.ts — Optimised for speed
 *
 * Key change: skip Supabase auth.getUser() for public static/asset routes.
 * Previously the auth check ran on EVERY request including _next/image,
 * adding 200-400ms Supabase round-trip to image loads.
 *
 * Now: only call getUser() for routes that actually need auth context.
 */

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const publicRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit:public",
});

const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit:auth",
});

const ordersRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit:orders",
});

// Routes where we MUST check auth
const PROTECTED_PREFIXES = ["/admin", "/account", "/checkout"];
// Routes where we never need auth (skip Supabase call entirely)
const PUBLIC_STATIC = [
  "/_next",
  "/favicon",
  "/robots",
  "/sitemap",
  "/logo",
  "/api/v1/banners", // public banner API — no auth needed
  "/api/search",     // public search — no auth needed
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Rate Limiting (Upstash Ratelimit) ─────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const ip = (request as unknown as { ip?: string }).ip ?? request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    let limitResult;

    if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/v1/auth/")) {
      limitResult = await authRatelimit.limit(ip);
    } else if (
      pathname.startsWith("/api/orders/") || 
      pathname.startsWith("/api/v1/orders/") || 
      pathname.startsWith("/api/v1/checkout")
    ) {
      limitResult = await ordersRatelimit.limit(ip);
    } else {
      limitResult = await publicRatelimit.limit(ip);
    }

    if (!limitResult.success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limitResult.limit.toString(),
            "X-RateLimit-Remaining": limitResult.remaining.toString(),
            "X-RateLimit-Reset": limitResult.reset.toString(),
          },
        }
      );
    }
  }

  // ── Fast path: skip auth entirely for static/public routes ──────────
  const isStatic = PUBLIC_STATIC.some((p) => pathname.startsWith(p));
  if (isStatic) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    return response;
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  response.headers.set("x-pathname", pathname);

  // ── Auth check (only for routes that need it) ────────────────────────
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const needsAuthCheck = isProtected || pathname === "/login";

  if (!needsAuthCheck) {
    // Public page (homepage, products, etc.) — skip auth entirely
    // Session will be checked server-side in individual pages if needed
    addSecurityHeaders(response);
    return response;
  }

  // ── Supabase session refresh (only protected + login routes) ─────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          response.headers.set("x-pathname", pathname);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Clear stale cookies
    const sbCookies = request.cookies.getAll().filter((c) =>
      c.name.startsWith("sb-")
    );
    sbCookies.forEach((c) => response.cookies.delete(c.name));

    if (isProtected) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      sbCookies.forEach((c) => redirectResponse.cookies.delete(c.name));
      return redirectResponse;
    }
  }

  // Admin redirect from homepage
  if (user?.user_metadata?.role === "ADMIN" && pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // HTTPS redirect in production
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const httpsUrl = `https://${request.headers.get("host")}${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(httpsUrl, { status: 301 });
  }

  addSecurityHeaders(response);
  return response;
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};