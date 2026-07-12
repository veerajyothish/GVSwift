export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

type EventParams = Record<string, unknown>

export function trackEvent(eventName: string, params: EventParams = {}) {
  if (typeof window === 'undefined') return
  if (!GA_ID) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;

  if (typeof win.gtag === 'function') {
    win.gtag('event', eventName, params)
    return
  }

  win.dataLayer = win.dataLayer || []
  win.dataLayer.push({
    event: eventName,
    ...params,
  })
}
