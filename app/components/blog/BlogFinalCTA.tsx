import { BlogTrackedCtaLink } from './BlogTrackedCtaLink';
import type { BlogCtaConfig } from '@/lib/blog-cta';

type BlogFinalCTAProps = {
  slug: string;
  config: BlogCtaConfig;
};

export function BlogFinalCTA({ slug, config }: BlogFinalCTAProps) {
  return (
    <section className="my-12 overflow-hidden rounded-3xl border border-[var(--line-2)] bg-[linear-gradient(150deg,var(--accent-soft)_0%,var(--bg-card)_62%,var(--bg-secondary)_100%)] p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Запустите в этом месяце</p>
      <h3 className="mt-2 text-2xl font-semibold leading-tight text-[var(--text-primary)]">{config.title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">{config.description}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
        <span className="rounded-full border border-[var(--line-2)] bg-[var(--bg-card)] px-2.5 py-1">14 дней бесплатно</span>
        <span className="rounded-full border border-[var(--line-2)] bg-[var(--bg-card)] px-2.5 py-1">Без привязки карты</span>
        <span className="rounded-full border border-[var(--line-2)] bg-[var(--bg-card)] px-2.5 py-1">Запуск за 10 минут</span>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <BlogTrackedCtaLink
          href={config.registerHref}
          eventName="blog_cta_final_click"
          eventPayload={{ slug, topic: config.topic, target: 'register' }}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          {config.registerLabel} →
        </BlogTrackedCtaLink>
        <BlogTrackedCtaLink
          href={config.featureHref}
          eventName="blog_cta_final_click"
          eventPayload={{ slug, topic: config.topic, target: 'feature' }}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-2)] bg-[var(--bg-card)] px-5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
        >
          {config.featureLabel}
        </BlogTrackedCtaLink>
      </div>
    </section>
  );
}
