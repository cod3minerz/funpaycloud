'use client';

import { useEffect } from 'react';

export default function SmoothScroll() {
  useEffect(() => {
    // Use native smooth scrolling to avoid RAF jank on heavy landing layers.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBehavior = html.style.scrollBehavior;
    const prevBodyBehavior = body.style.scrollBehavior;

    html.style.scrollBehavior = 'smooth';
    body.style.scrollBehavior = 'smooth';

    return () => {
      html.style.scrollBehavior = prevHtmlBehavior;
      body.style.scrollBehavior = prevBodyBehavior;
    };
  }, []);

  return null;
}
