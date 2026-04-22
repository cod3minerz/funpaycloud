import Image from 'next/image';
import Link from 'next/link';
import type { BlogPostSummary } from '@/lib/blog-types';
import { formatDate, slugifyCategory } from '@/lib/blog-types';

export function BlogCard({ post }: { post: BlogPostSummary }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_18px_36px_-30px_color-mix(in_srgb,var(--accent)_48%,transparent)]">
      {post.cover && (
        <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] overflow-hidden border-b border-[var(--border)]">
          <Image
            src={post.cover}
            alt={post.title}
            width={800}
            height={450}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <Link
            href={`/blog/category/${slugifyCategory(post.category)}`}
            className="inline-flex min-h-8 items-center rounded-full border border-[var(--line-2)] bg-[var(--accent-soft)] px-2.5 text-xs font-semibold text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
          >
            {post.category}
          </Link>
          <span className="text-xs text-[var(--text-muted)]">{post.readingTime} мин</span>
        </div>

        <h3 className="mb-2 line-clamp-2 text-lg font-semibold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>

        <p className="mb-5 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">{post.description}</p>

        <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <time>{formatDate(post.date)}</time>
          <Link
            href={`/blog/${post.slug}`}
            className="font-semibold text-[var(--accent)] transition-transform duration-150 group-hover:translate-x-0.5"
          >
            Читать →
          </Link>
        </div>
      </div>
    </article>
  );
}
