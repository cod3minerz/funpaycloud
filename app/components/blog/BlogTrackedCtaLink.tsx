'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { trackBlogEvent } from './trackBlogEvent';

type BlogTrackedCtaLinkProps = {
  href: string;
  eventName: 'blog_cta_inline_click' | 'blog_cta_final_click' | 'blog_cta_sticky_click';
  eventPayload?: Record<string, string | number | boolean>;
  className: string;
  children: ReactNode;
};

export function BlogTrackedCtaLink({ href, eventName, eventPayload, className, children }: BlogTrackedCtaLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackBlogEvent(eventName, eventPayload)}
    >
      {children}
    </Link>
  );
}
