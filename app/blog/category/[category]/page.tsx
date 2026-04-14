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
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Категория</p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">{category}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{posts.length} статей в этой категории.</p>
        <Link href="/blog" className="mt-4 inline-flex text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]">
          ← Все статьи
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {posts.map(post => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </section>
    </div>
  );
}
