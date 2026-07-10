// instrumentation-client.ts — replaces sentry.client.config.ts for Turbopack compatibility
import * as Sentry from "@sentry/nextjs";

const PII_KEYS = new Set(["email", "name", "phone", "address"]);

function scrubPii(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(scrubPii);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (PII_KEYS.has(key.toLowerCase())) {
        delete (value as Record<string, unknown>)[key];
      } else {
        scrubPii(entry);
      }
    }
  }
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  debug: false,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.thirdPartyErrorFilterIntegration({
      filterKeys: ['gvswift'],
      behaviour: 'drop-error-if-contains-third-party-frames',
    }),
  ],
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    'Java object is gone',
  ],
  beforeSend(event, hint) {
    const err = hint?.originalException as Error | undefined;
    if (err?.name === 'AbortError') return null; // intentional cancellations only

    const user = event.user as { email?: unknown; name?: unknown } | undefined;
    if (user?.email || user?.name) return null;
    scrubPii(event);
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
