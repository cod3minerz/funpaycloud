import { BlogTrackedCtaLink } from './BlogTrackedCtaLink';
import { getCtaConfig, type BlogCtaTopic } from '@/lib/blog-cta';

type BlogInlineCTAProps = {
  topic?: BlogCtaTopic;
  slug?: string;
};

export function BlogInlineCTA({ topic = 'automation', slug }: BlogInlineCTAProps) {
  const config = getCtaConfig(topic);

  return (
    <aside className="my-8 rounded-2xl border border-[var(--line-2)] bg-[linear-gradient(155deg,var(--accent-soft)_0%,var(--bg-card)_100%)] p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">Практический шаг</p>
      <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{config.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{config.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
        <span className="rounded-full border border-[var(--line-2)] bg-[var(--bg-card)] px-2.5 py-1">14 дней бесплатно</span>
        <span className="rounded-full border border-[var(--line-2)] bg-[var(--bg-card)] px-2.5 py-1">Без карты</span>
        <span className="rounded-full border border-[var(--line-2)] bg-[var(--bg-card)] px-2.5 py-1">Запуск за 10 минут</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <BlogTrackedCtaLink
          href={config.featureHref}
          eventName="blog_cta_inline_click"
          eventPayload={{ slug: slug ?? 'unknown', topic: config.topic, target: 'feature' }}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--accent)] bg-[var(--bg-card)] px-4 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]"
        >
          {config.featureLabel} →
        </BlogTrackedCtaLink>
      </div>
    </aside>
  );
}
