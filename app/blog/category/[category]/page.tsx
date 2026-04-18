import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlogCard } from '../../../components/blog/BlogCard';
import { getCategories, getCategoryBySlug, getPostsByCategory, slugifyCategory } from '@/lib/blog';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return getCategories().map(category => ({ category: slugifyCategory(category) }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(decodeURIComponent(categorySlug));

  if (!category) {
    return { title: 'Категория не найдена | FunPay Cloud Blog' };
  }

  return {
    title: `${category} | FunPay Cloud Blog`,
    description: `Подборка материалов категории «${category}» в блоге FunPay Cloud.`,
    alternates: {
      canonical: `https://funpay.cloud/blog/category/${categorySlug}`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(decodeURIComponent(categorySlug));

  if (!category) notFound();

  const posts = getPostsByCategory(category);

  return (
    <div>
      <section className="rounded-3xl border border-[var(--line-2)] bg-[linear-gradient(165deg,var(--bg-card)_0%,var(--bg-secondary)_100%)] px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Категория</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">{category}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          {posts.length} статей в этой категории. Все материалы отсортированы от новых к более ранним.
        </p>

        <div className="mt-6">
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center rounded-xl border border-[var(--line-2)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
          >
            ← Назад ко всем статьям
          </Link>
        </div>
      </section>

      {posts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[var(--line-2)] bg-[var(--bg-card)] px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
          В этой категории пока нет материалов.
        </div>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map(post => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </section>
      )}
    </div>
  );
}
