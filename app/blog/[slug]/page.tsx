import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlogPost } from '../../components/blog/BlogPost';
import { BlogCard } from '../../components/blog/BlogCard';
import { ReadingProgress } from '../../components/blog/ReadingProgress';
import { TableOfContents } from '../../components/blog/TableOfContents';
import { BlogFinalCTA } from '../../components/blog/BlogFinalCTA';
import { BlogStickyCTA } from '../../components/blog/BlogStickyCTA';
import {
  extractHeadings,
  formatDate,
  getAllPostSummaries,
  getPostBySlug,
  getRelatedPosts,
  slugifyCategory,
} from '@/lib/blog';
import { getCommercialLinksForPost } from '@/lib/blog-commercial-links';
import { getCtaConfigForPost, getTopicForPost } from '@/lib/blog-cta';

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
  const commercialLinks = getCommercialLinksForPost(post, 3);
  const ctaTopic = getTopicForPost(post);
  const ctaConfig = getCtaConfigForPost(post);

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
        url: 'https://funpay.cloud/android-chrome-512x512.png',
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

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 xl:grid-cols-[minmax(0,760px)_300px]">
        <div>
          <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <Link href="/blog" className="transition-colors hover:text-[var(--text-primary)]">
              Блог
            </Link>
            <span>•</span>
            <Link href={`/blog/category/${slugifyCategory(post.category)}`} className="transition-colors hover:text-[var(--text-primary)]">
              {post.category}
            </Link>
          </nav>

          <div className="rounded-3xl border border-[var(--line-2)] bg-[var(--bg-card)] px-5 py-7 sm:px-8 sm:py-9">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="inline-flex min-h-7 items-center rounded-full border border-[var(--line-2)] bg-[var(--accent-soft)] px-2.5 font-semibold text-[var(--accent)]">
                {post.category}
              </span>
              <span>·</span>
              <time>{formatDate(post.date)}</time>
              <span>·</span>
              <span>{post.readingTime} мин</span>
            </div>

            <h1 className="text-3xl font-semibold leading-tight text-[var(--text-primary)] sm:text-4xl">{post.title}</h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">{post.description}</p>

            <div className="mt-6 flex items-center gap-3 border-t border-[var(--line)] pt-6 text-sm text-[var(--text-secondary)]">
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full border border-[var(--line-2)] bg-[var(--bg-secondary)]"
              />
              <div>
                <p className="font-medium text-[var(--text-primary)]">{post.author.name}</p>
                <p>{formatDate(post.updated || post.date)}</p>
              </div>
            </div>
          </div>

          {post.cover && (
            <div className="mt-7 overflow-hidden rounded-3xl border border-[var(--line-2)] bg-[var(--bg-card)]">
              <Image
                src={post.cover}
                alt={post.title}
                width={1200}
                height={630}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 760px"
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          )}

          <div className="mt-7 xl:hidden">
            <details className="rounded-2xl border border-[var(--line-2)] bg-[var(--bg-card)]">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                📋 Содержание статьи
              </summary>
              <div className="border-t border-[var(--line)] px-3 py-2">
                <TableOfContents headings={headings} mobile />
              </div>
            </details>
          </div>

          <div className="mt-8 rounded-3xl border border-[var(--line-2)] bg-[var(--bg-card)] px-5 py-7 sm:px-8 sm:py-8">
            <BlogPost content={post.content} slug={post.slug} topic={ctaTopic} />
          </div>

          <BlogFinalCTA slug={post.slug} config={ctaConfig} />

          {commercialLinks.length > 0 && (
            <section className="mb-12 rounded-3xl border border-[var(--line-2)] bg-[var(--bg-card)] p-6 sm:p-7">
              <h2 className="mb-2 text-2xl font-semibold text-[var(--text-primary)]">Следующий шаг по теме</h2>
              <p className="mb-5 text-sm text-[var(--text-secondary)]">
                Если хотите внедрить это на практике, начните с одного из релевантных разделов платформы.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {commercialLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group rounded-2xl border border-[var(--line-2)] bg-[var(--bg-secondary)]/75 p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                      {link.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{link.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {relatedPosts.length > 0 && (
            <section>
              <h2 className="mb-5 text-2xl font-semibold text-[var(--text-primary)]">Похожие статьи</h2>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {relatedPosts.map(item => (
                  <BlogCard key={item.slug} post={item} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-5 rounded-3xl border border-[var(--line-2)] bg-[var(--bg-card)] p-5 shadow-[var(--blog-shadow-soft)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Содержание</h2>
            <TableOfContents headings={headings} />
            <div className="border-t border-[var(--line)] pt-4">
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Хотите такое же качество операционки в магазине? Подключите FunPay Cloud и автоматизируйте рутину.
              </p>
              <Link
                href="/auth/register"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--accent)] px-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                Попробовать бесплатно
              </Link>
            </div>
          </div>
        </aside>
      </div>
      <BlogStickyCTA slug={post.slug} config={ctaConfig} />
    </>
  );
}
