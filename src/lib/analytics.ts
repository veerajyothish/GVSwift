"use client";

/**
 * lib/analytics.ts — GA4 helper (consent-aware)
 *
 * GA4 must NOT fire any network requests before the user grants cookie consent
 * (see TICKET-802 — cookie consent banner). This module checks for consent
 * before sending events.
 *
 * The GA4 <script> tag is only injected into the DOM after consent is granted
 * (implemented in TICKET-802). This helper assumes the gtag function exists
 * when called; if consent hasn't been given yet, gtag won't be defined and
 * calls are silently ignored.
 *
 * TICKET-802 will integrate this with the consent banner.
 */

declare global {
  var gtag: (
    command: "config" | "event" | "consent",
    targetOrAction: string,
    params?: Record<string, unknown>
  ) => void;
}

/**
 * Sends a GA4 event. No-ops if gtag is not yet defined (i.e., consent not
 * yet given or GA4 script not loaded).
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", eventName, params);
}
