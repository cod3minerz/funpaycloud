'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { BlogTrackedCtaLink } from './BlogTrackedCtaLink';
import { trackBlogEvent } from './trackBlogEvent';
import type { BlogCtaConfig } from '@/lib/blog-cta';

type BlogStickyCTAProps = {
  slug: string;
  config: BlogCtaConfig;
};

const DISMISS_KEY = 'blog_sticky_cta_dismissed_v1';

export function BlogStickyCTA({ slug, config }: BlogStickyCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(DISMISS_KEY) === '1';
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const close = () => {
    window.localStorage.setItem(DISMISS_KEY, '1');
    trackBlogEvent('blog_cta_close_sticky', { slug, topic: config.topic });
    setVisible(false);
  };

  const subtitle = useMemo(() => {
    if (config.topic === 'delivery') return 'Автовыдача без VPS';
    if (config.topic === 'raise') return 'Автоподнятие 24/7';
    if (config.topic === 'ai') return 'AI-ответы для чатов';
    if (config.topic === 'comparison') return 'SaaS вместо self-hosted';
    return 'Автоматизация магазина';
  }, [config.topic]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[65] border-t border-[var(--line-2)] bg-[color:color-mix(in_srgb,var(--bg-card)_96%,transparent)] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pt-2 shadow-[var(--blog-shadow-soft)] backdrop-blur-md xl:hidden">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 rounded-xl border border-[var(--line-2)] bg-[var(--bg)] px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{subtitle}</p>
          <p className="truncate text-[11px] text-[var(--text-muted)]">14 дней бесплатно, без карты</p>
        </div>
        <BlogTrackedCtaLink
          href={config.registerHref}
          eventName="blog_cta_sticky_click"
          eventPayload={{ slug, topic: config.topic, target: 'register' }}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] px-3 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          Начать →
        </BlogTrackedCtaLink>
        <button
          type="button"
          onClick={close}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line-2)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          aria-label="Скрыть нижний CTA"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
