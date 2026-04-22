'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { BlogPostSummary } from '@/lib/blog-types';
import { formatDate, slugifyCategory } from '@/lib/blog-types';
import { BlogCard } from './BlogCard';

interface BlogFeedClientProps {
  posts: BlogPostSummary[];
  categories: string[];
}

const commercialQuickLinks = [
  { href: '/funpay-bot', label: 'Облачный бот FunPay' },
  { href: '/funpay-automation', label: 'Автоматизация FunPay' },
  { href: '/auto-raise-lots-funpay', label: 'Автоподнятие' },
  { href: '/auto-delivery-funpay', label: 'Автовыдача' },
  { href: '/funpay-auto-reply', label: 'AI-автоответы' },
  { href: '/funpay-cardinal-alternative', label: 'Альтернатива Cardinal' },
];

export function BlogFeedClient({ posts, categories }: BlogFeedClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Все');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 300);

    return () => window.clearTimeout(id);
  }, [query]);

  const featured = useMemo(() => posts.find(post => post.featured) ?? posts[0], [posts]);

  const filtered = useMemo(() => {
    return posts.filter(post => {
      if (post.slug === featured?.slug) return false;

      const categoryMatch = activeCategory === 'Все' || post.category === activeCategory;
      if (!categoryMatch) return false;

      if (!debouncedQuery) return true;

      const haystack = `${post.title} ${post.description} ${post.tags.join(' ')}`.toLowerCase();
      return haystack.includes(debouncedQuery);
    });
  }, [activeCategory, debouncedQuery, featured?.slug, posts]);

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-[var(--line-2)] bg-[linear-gradient(165deg,var(--bg-card)_0%,var(--bg-secondary)_100%)] px-5 py-10 shadow-[0_20px_44px_-36px_color-mix(in_srgb,var(--text-primary)_32%,transparent)] sm:px-9 sm:py-14">
        <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-[color:color-mix(in_srgb,var(--line-2)_65%,transparent)] blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Блог FunPay Cloud</p>
          <h1 className="text-3xl font-semibold leading-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
            Практические материалы для продавцов FunPay
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Разбираем рабочие сценарии: от автоподнятия и выдачи до роста конверсии и стабильной операционки магазина.
          </p>

          <label className="mt-7 flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--line-2)] bg-[var(--bg-card)] px-4 shadow-[var(--blog-shadow-soft)]">
            <Search size={18} className="text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              className="h-11 w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              placeholder="Поиск по статьям, тегам и темам..."
              aria-label="Поиск по статьям"
            />
          </label>
        </div>
      </section>

      <section id="categories" className="mt-8">
        <div className="mb-4 rounded-2xl border border-[var(--line-2)] bg-[var(--bg-card)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Быстрый старт</p>
          <div className="flex flex-wrap gap-2">
            {commercialQuickLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-9 items-center rounded-full border border-[var(--line-2)] bg-[var(--bg-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {['Все', ...categories].map(category => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--line-2)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {featured && (
        <section className="mt-8" id="about">
          <article className="overflow-hidden rounded-3xl border border-[var(--line-2)] bg-[var(--bg-card)] shadow-[0_20px_40px_-34px_color-mix(in_srgb,var(--text-primary)_42%,transparent)]">
            {featured.cover && (
              <Link href={`/blog/${featured.slug}`} className="relative block aspect-[1200/630] w-full overflow-hidden border-b border-[var(--line)]">
                <Image
                  src={featured.cover}
                  alt={featured.title}
                  width={1200}
                  height={630}
                  sizes="100vw"
                  className="h-full w-full object-cover"
                  priority
                />
              </Link>
            )}

            <div className="p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/blog/category/${slugifyCategory(featured.category)}`}
                  className="inline-flex min-h-8 items-center rounded-full border border-[var(--line-2)] bg-[var(--accent-soft)] px-3 text-xs font-semibold text-[var(--accent)]"
                >
                  {featured.category}
                </Link>
                <span className="text-xs text-[var(--text-muted)]">{featured.readingTime} мин чтения</span>
              </div>

              <h2 className="text-2xl font-semibold leading-tight text-[var(--text-primary)] sm:text-3xl">
                <Link href={`/blog/${featured.slug}`} className="transition-colors hover:text-[var(--accent)]">
                  {featured.title}
                </Link>
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">{featured.description}</p>

              <div className="mt-7 flex items-center justify-between gap-2">
                <time className="text-xs text-[var(--text-muted)]">{formatDate(featured.date)}</time>
                <Link
                  href={`/blog/${featured.slug}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                >
                  Читать статью →
                </Link>
              </div>
            </div>
          </article>
        </section>
      )}

      <section className="mt-10" id="latest">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Последние статьи</h2>
          <p className="text-sm text-[var(--text-secondary)]">{filtered.length} материалов</p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line-2)] bg-[var(--bg-card)] px-6 py-12 text-center">
            <p className="text-base font-medium text-[var(--text-primary)]">Ничего не найдено по текущему фильтру</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Попробуйте другую категорию или измените поисковый запрос.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('Все');
                setQuery('');
              }}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-2)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(post => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
