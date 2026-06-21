/**
 * sentry.server.config.ts — Sentry server-side initialization
 *
 * TICKET-903 completes this with:
 *   - beforeSend hook stripping PII (email, phone) from server-side events
 *   - Alert rule configuration in the Sentry dashboard
 *
 * Uses SENTRY_DSN (server-only — never prefix with NEXT_PUBLIC_).
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: 0.1,

  enabled: process.env.NODE_ENV === "production",

  // TODO: TICKET-903 — add beforeSend hook to strip email/phone from events:
  // beforeSend(event) {
  //   if (event.user) {
  //     delete event.user.email;
  //     delete event.user.ip_address;
  //   }
  //   // Strip phone from request data
  //   return event;
  // },
});
