/**
 * lib/auth/guards.ts — Authentication & authorization guards
 *
 * Two families of guards — pick based on calling context:
 *
 * ── For Server Components & pages (redirect on failure):
 *    requireUser()    → returns Prisma User or redirects to /login
 *    requireAdmin()   → returns Prisma User or redirects/throws 403
 *
 * ── For Route Handlers (return NextResponse on failure, never redirect):
 *    requireUserForApi()   → returns { user } or NextResponse (401)
 *    requireAdminForApi()  → returns { user } or NextResponse (401/403)
 *
 * Design rationale (docs/03-Security-Access.md §2):
 *   - Role is sourced from the Prisma User table, NOT the JWT. This means
 *     role changes take effect immediately on the next request without
 *     requiring a token re-issue.
 *   - Role mismatch on an admin route → 403 (admin existence isn't sensitive)
 *   - Ownership mismatch on user-owned resources → 404 (see CONTEXT.md §3)
 *     Ownership checks live in the feature service layers, not here.
 *   - All guards fail-closed: deny by default at each step.
 */

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import { cache } from "react";

/**
 * Request-memoized helper to fetch a user from Prisma by their Supabase ID.
 */
export const getPrismaUserBySupabaseId = cache(async (supabaseId: string) => {
  return prisma.user.findUnique({
    where: { supabaseId },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Server Component / Page guards (use redirect() for navigation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the Prisma User record for the authenticated user.
 * If unauthenticated, redirects to /login (does NOT return).
 *
 * Use in Server Components, page.tsx, and layout.tsx.
 */
export async function requireUser(): Promise<User> {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const user = await getPrismaUserBySupabaseId(session.id);

  if (!user) {
    // Auth user exists in Supabase but no matching Prisma record.
    // This can only happen if the signup webhook/action failed to create the
    // Prisma row. Redirect to login; the user must sign up again or contact
    // support. Do not expose the internal inconsistency.
    redirect("/login");
  }

  return user;
}

/**
 * Returns the Prisma User record if the user is authenticated AND has
 * the ADMIN role.
 *
 * If unauthenticated → redirects to /login.
 * If authenticated but not ADMIN → throws a redirect to /login
 *   (admin-specific 403 page can be added later; for now we redirect
 *    rather than showing a raw error on a non-existent admin UI).
 *
 * Use in /admin/* Server Components and layouts.
 */
export async function requireAdmin(): Promise<User> {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const user = await getPrismaUserBySupabaseId(session.id);

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    // Authenticated but wrong role. Redirect to home rather than /login
    // to avoid a confusing "please log in" message for a logged-in user.
    redirect("/");
  }

  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Handler guards (return NextResponse — never redirect in API routes)
// ─────────────────────────────────────────────────────────────────────────────

type ApiGuardSuccess = { user: User; errorResponse: null };
type ApiGuardFailure = { user: null; errorResponse: NextResponse };
type ApiGuardResult = ApiGuardSuccess | ApiGuardFailure;

/**
 * Guard for Route Handlers that require any authenticated user.
 *
 * Returns { user, errorResponse: null } on success.
 * Returns { user: null, errorResponse: NextResponse(401) } on failure.
 *
 * Usage:
 *   const { user, errorResponse } = await requireUserForApi();
 *   if (errorResponse) return errorResponse;
 *   // user is guaranteed to be non-null here
 */
export async function requireUserForApi(): Promise<ApiGuardResult> {
  const session = await getServerSession();

  if (!session) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  const user = await getPrismaUserBySupabaseId(session.id);

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  return { user, errorResponse: null };
}

/**
 * Guard for Route Handlers that require the ADMIN role.
 *
 * Returns { user, errorResponse: null } on success.
 * Returns { user: null, errorResponse: NextResponse(401) } if unauthenticated.
 * Returns { user: null, errorResponse: NextResponse(403) } if authenticated but not ADMIN.
 *
 * Usage:
 *   const { user, errorResponse } = await requireAdminForApi();
 *   if (errorResponse) return errorResponse;
 *   // user is guaranteed ADMIN here
 */
export async function requireAdminForApi(): Promise<ApiGuardResult> {
  const globalMock = global as unknown as { __mockAdminSession?: User | null };
  if (process.env.NODE_ENV === "test" && globalMock.__mockAdminSession !== undefined) {
    const mockUser = globalMock.__mockAdminSession;
    if (mockUser === null) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: "Authentication required", code: "UNAUTHORIZED" },
          { status: 401 }
        ),
      };
    }
    if (mockUser.role !== "ADMIN") {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: "Admin access required", code: "FORBIDDEN" },
          { status: 403 }
        ),
      };
    }
    return { user: mockUser, errorResponse: null };
  }

  const session = await getServerSession();

  if (!session) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  const user = await getPrismaUserBySupabaseId(session.id);

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "ADMIN") {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Admin access required", code: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}
