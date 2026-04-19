'use client';

const METRIKA_ID = 108517547;

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackBlogEvent(eventName: string, payload?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.ym === 'function') {
      window.ym(METRIKA_ID, 'reachGoal', eventName, payload ?? {});
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        event_category: 'blog_cta',
        ...(payload ?? {}),
      });
    }
  } catch {
    // no-op: tracking must never break user flow
  }
}
