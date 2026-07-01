import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // lower sample rate for edge — high volume
  debug: false,

  // Edge runtime: no file-based integrations, no Node.js profiling
  integrations: [], // explicitly empty — no BrowserTracing, no Profiling

  beforeSend(event) {
    // Strip PII from edge events
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }

    // Drop events with user PII
    const user = event.user as { email?: unknown; name?: unknown } | undefined;
    if (user?.email || user?.name) {
      return null;
    }

    return event;
  },
});
