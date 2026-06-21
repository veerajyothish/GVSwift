/**
 * sentry.client.config.ts — Sentry browser-side initialization
 *
 * TICKET-903 completes this with:
 *   - beforeSend hook stripping PII (email, phone) from event payloads
 *   - Alert rule configuration in the Sentry dashboard
 *
 * This stub initializes Sentry so errors are captured from day one.
 * The DSN is read from NEXT_PUBLIC_SENTRY_DSN (safe to expose client-side).
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions for performance monitoring (adjust at launch)
  tracesSampleRate: 0.1,

  // Only enable in production — avoids noise during development
  enabled: process.env.NODE_ENV === "production",

  // TODO: TICKET-903 — add beforeSend hook to strip email/phone from events:
  // beforeSend(event) {
  //   if (event.user) {
  //     delete event.user.email;
  //     delete event.user.ip_address;
  //   }
  //   return event;
  // },
});
