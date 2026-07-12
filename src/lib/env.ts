/**
 * lib/env.ts — Environment-aware URL construction and validation helpers.
 */

/**
 * Returns the environment-aware site URL.
 * Prefers process.env.NEXT_PUBLIC_SITE_URL if configured,
 * defaults to the custom production domain 'https://www.gvswift.com' in production,
 * and 'http://localhost:3000' in development.
 */
export function getSiteUrl(): string {
  // Enforce canonical domain in production unless it's a Vercel preview branch
  if (
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV !== "preview" &&
    process.env.VERCEL_ENV !== "development"
  ) {
    return "https://gvswift.com";
  }

  // Fallback to explicit env var or localhost
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

/**
 * Validates a redirect URL parameter for safety.
 * Restricts redirects to same-site relative paths beginning with '/'
 * to prevent open-redirect vulnerabilities.
 */
export function isValidRedirect(url: string | null | undefined): boolean {
  if (!url) return false;
  // Must start with '/' and not be a protocol-relative '//' URL
  return url.startsWith("/") && !url.startsWith("//");
}
