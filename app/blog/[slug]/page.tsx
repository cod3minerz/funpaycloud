import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlogPost } from '../../components/blog/BlogPost';
import { BlogCard } from '../../components/blog/BlogCard';
import { ReadingProgress } from '../../components/blog/ReadingProgress';
import { TableOfContents } from '../../components/blog/TableOfContents';
import {
  extractHeadings,
  formatDate,
  getAllPostSummaries,
  getPostBySlug,
  getRelatedPosts,
  slugifyCategory,
} from '@/lib/blog';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPostSummaries().map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Статья не найдена | FunPay Cloud Blog',
    };
  }

  return {
    title: `${post.title} | FunPay Cloud Blog`,
    description: post.description,
    keywords: post.tags.join(', '),
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      tags: post.tags,
      images: post.cover ? [{ url: post.cover, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: post.cover ? [post.cover] : [],
    },
    alternates: {
      canonical: `https://funpay.cloud/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const headings = extractHeadings(post.content);
  const relatedPosts = getRelatedPosts(post.slug, post.category, 3);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: {
      '@type': 'Organization',
      name: post.author.name,
      url: 'https://funpay.cloud',
    },
    publisher: {
      '@type': 'Organization',
      name: 'FunPay Cloud',
      logo: {
        '@type': 'ImageObject',
        url: 'https://funpay.cloud/logo.png',
      },
    },
    image: post.cover,
    mainEntityOfPage: `https://funpay.cloud/blog/${post.slug}`,
  };

  return (
    <>
      <ReadingProgress />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 xl:grid-cols-[minmax(0,680px)_280px]">
        <div>
          <nav className="mb-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Link href="/blog" className="hover:text-[var(--text-primary)]">
              Блог
            </Link>
            <span>•</span>
            <Link href={`/blog/category/${slugifyCategory(post.category)}`} className="hover:text-[var(--text-primary)]">
              {post.category}
            </Link>
          </nav>

          <div className="mb-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{post.category}</span>
            <span>·</span>
            <time>{formatDate(post.date)}</time>
            <span>·</span>
            <span>{post.readingTime} мин</span>
          </div>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl lg:text-4xl">{post.title}</h1>

          <div className="mt-5 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <Image
              src={post.author.avatar}
              alt={post.author.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-[var(--border)]"
            />
            <div>
              <p className="font-medium text-[var(--text-primary)]">{post.author.name}</p>
              <p>{formatDate(post.updated || post.date)}</p>
            </div>
          </div>

          {post.cover && (
            <div className="mt-8 overflow-hidden rounded-xl border border-[var(--border)]">
              <Image
                src={post.cover}
                alt={post.title}
                width={1200}
                height={630}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 680px"
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          )}

          <div className="mt-7 xl:hidden">
            <details className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                📋 Содержание статьи
              </summary>
              <div className="border-t border-[var(--border)] px-3 py-2">
                <TableOfContents headings={headings} mobile />
              </div>
            </details>
          </div>

          <div className="mt-8">
            <BlogPost content={post.content} />
          </div>

          <div className="my-12 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-blue-600/10 p-6">
            <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Попробуйте FunPay Cloud бесплатно</h3>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              14 дней бесплатно. Все Pro функции. Без привязки карты.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] sm:w-auto"
            >
              Начать бесплатно →
            </Link>
          </div>

          {relatedPosts.length > 0 && (
            <section>
              <h2 className="mb-5 text-xl font-semibold text-[var(--text-primary)]">Похожие статьи</h2>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {relatedPosts.map(item => (
                  <BlogCard key={item.slug} post={item} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Содержание</h2>
            <TableOfContents headings={headings} />
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-sm text-[var(--text-secondary)]">14 дней бесплатно, чтобы протестировать автоматизацию в реальной продаже.</p>
              <Link
                href="/auth/register"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
              >
                Попробовать бесплатно
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
