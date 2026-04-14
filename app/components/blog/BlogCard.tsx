import Image from 'next/image';
import Link from 'next/link';
import type { BlogPostSummary } from '@/lib/blog-types';
import { formatDate, slugifyCategory } from '@/lib/blog-types';

export function BlogCard({ post }: { post: BlogPostSummary }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-200 hover:border-[var(--accent)] hover:shadow-lg hover:shadow-blue-500/5">
      {post.cover && (
        <div className="aspect-[16/9] overflow-hidden">
          <Image
            src={post.cover}
            alt={post.title}
            width={800}
            height={450}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2">
          <Link
            href={`/blog/category/${slugifyCategory(post.category)}`}
            className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-[var(--accent)] hover:bg-blue-500/20"
          >
            {post.category}
          </Link>
          <span className="text-xs text-[var(--text-muted)]">{post.readingTime} мин</span>
        </div>

        <h2 className="mb-2 line-clamp-2 text-base font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>

        <p className="mb-4 line-clamp-3 flex-1 text-sm text-[var(--text-secondary)]">{post.description}</p>

        <div className="flex items-center justify-between">
          <time className="text-xs text-[var(--text-muted)]">{formatDate(post.date)}</time>
          <Link
            href={`/blog/${post.slug}`}
            className="text-xs font-medium text-[var(--accent)] transition-transform group-hover:translate-x-0.5"
          >
            Читать →
          </Link>
        </div>
      </div>
    </article>
  );
}
