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
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">FunPay Cloud</p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl lg:text-4xl">Блог FunPay Cloud</h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)] sm:text-base">
            Руководства, советы и кейсы, которые помогают продавцам на FunPay работать стабильнее и продавать больше.
          </p>

          <label className="mt-7 flex min-h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4">
            <Search size={18} className="text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              className="h-11 w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              placeholder="Поиск по статьям..."
              aria-label="Поиск по статьям"
            />
          </label>
        </div>
      </section>

      <section className="mt-8" id="categories">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {['Все', ...categories].map(category => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`min-h-11 whitespace-nowrap rounded-full border px-3 py-2 text-sm transition-colors ${
                activeCategory === category
                  ? 'border-[var(--accent)] bg-blue-500/10 text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {featured && (
        <section className="mt-8">
          <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
            {featured.cover && (
              <div className="relative aspect-[1200/630] w-full overflow-hidden">
                <Image
                  src={featured.cover}
                  alt={featured.title}
                  width={1200}
                  height={630}
                  sizes="100vw"
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            )}

            <div className="p-5 sm:p-7">
              <div className="mb-4 flex items-center justify-between gap-2">
                <Link
                  href={`/blog/category/${slugifyCategory(featured.category)}`}
                  className="text-xs font-medium text-[var(--accent)]"
                >
                  {featured.category}
                </Link>
                <span className="text-xs text-[var(--text-muted)]">{featured.readingTime} мин чтения</span>
              </div>

              <h2 className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
                <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
              </h2>
              <p className="mt-3 max-w-3xl text-sm text-[var(--text-secondary)] sm:text-base">{featured.description}</p>

              <div className="mt-6 flex items-center justify-between">
                <time className="text-xs text-[var(--text-muted)]">{formatDate(featured.date)}</time>
                <Link
                  href={`/blog/${featured.slug}`}
                  className="text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                >
                  Читать →
                </Link>
              </div>
            </div>
          </article>
        </section>
      )}

      <section className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3" id="about">
        {filtered.map(post => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </section>

      {filtered.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-[var(--border)] px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
          По вашему запросу ничего не найдено. Попробуйте изменить фильтр категории или ключевые слова.
        </div>
      )}
    </>
  );
}
