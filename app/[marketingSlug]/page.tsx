import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SeoPageTemplate from '@/components/seo/SeoPageTemplate';
import { getSeoPageConfig, getSeoSlugs } from '@/lib/marketing-seo-pages';
import { getAllPostSummaries } from '@/lib/blog';

interface MarketingSeoPageProps {
  params: Promise<{ marketingSlug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getSeoSlugs().map(marketingSlug => ({ marketingSlug }));
}

export async function generateMetadata({ params }: MarketingSeoPageProps): Promise<Metadata> {
  const { marketingSlug } = await params;
  const page = getSeoPageConfig(marketingSlug);

  if (!page) {
    return {
      title: 'Страница не найдена | FunPay Cloud',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonical = `https://funpay.cloud/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical,
    },
    keywords: [page.primaryQuery, ...page.secondaryQueries],
    openGraph: {
      title: page.title,
      description: page.description,
      url: canonical,
      type: 'website',
      locale: 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
    },
  };
}

export default async function MarketingSeoPage({ params }: MarketingSeoPageProps) {
  const { marketingSlug } = await params;
  const page = getSeoPageConfig(marketingSlug);
  if (!page) notFound();

  const summaries = getAllPostSummaries();
  const searchTokens = [page.primaryQuery, ...page.secondaryQueries]
    .join(' ')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/gu)
    .filter(token => token.length >= 4);

  const scoredArticles = summaries
    .map(post => {
      const haystack = `${post.title} ${post.description} ${post.tags.join(' ')}`.toLowerCase();
      const score = searchTokens.reduce((acc, token) => (haystack.includes(token) ? acc + 1 : acc), 0);
      return { post, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.post.date).getTime() - new Date(a.post.date).getTime())
    .slice(0, 3)
    .map(item => item.post);

  return (
    <SeoPageTemplate
      page={page}
      canonicalUrl={`https://funpay.cloud/${page.slug}`}
      supportingArticles={scoredArticles}
    />
  );
}
