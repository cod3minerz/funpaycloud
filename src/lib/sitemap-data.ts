import { getAllPostSummaries, getCategories, slugifyCategory } from '@/lib/blog';
import { getSeoSlugs } from '@/lib/marketing-seo-pages';

export type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
};

export const BASE_URL = 'https://funpay.cloud';

const LEGAL_PATHS = [
  '/legal',
  '/legal/privacy-policy',
  '/legal/terms-of-service',
  '/legal/disclaimer',
  '/legal/personal-data-consent',
  '/legal/cookie-policy',
] as const;

function formatIsoDate(value: Date): string {
  return value.toISOString();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function entryToXml(entry: SitemapEntry): string {
  return [
    '<url>',
    `<loc>${escapeXml(entry.url)}</loc>`,
    `<lastmod>${formatIsoDate(entry.lastModified)}</lastmod>`,
    `<changefreq>${entry.changeFrequency}</changefreq>`,
    `<priority>${entry.priority.toFixed(1)}</priority>`,
    '</url>',
  ].join('');
}

export function buildUrlSetXml(entries: SitemapEntry[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries.map(entryToXml).join(''),
    '</urlset>',
  ].join('');
}

export function buildSitemapIndexXml(paths: string[]): string {
  const now = formatIsoDate(new Date());
  const body = paths
    .map(path => `<sitemap><loc>${escapeXml(`${BASE_URL}${path}`)}</loc><lastmod>${now}</lastmod></sitemap>`)
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    '</sitemapindex>',
  ].join('');
}

export function getMainSitemapEntries(): SitemapEntry[] {
  const now = new Date();
  const marketingEntries = getSeoSlugs().map(slug => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    ...marketingEntries,
  ];
}

export function getLegalSitemapEntries(): SitemapEntry[] {
  const now = new Date();
  return LEGAL_PATHS.map(path => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'yearly',
    priority: 0.4,
  }));
}

export function getBlogSitemapEntries(): SitemapEntry[] {
  const now = new Date();
  const posts = getAllPostSummaries();
  const categories = getCategories();

  const categoryEntries = categories.map(category => ({
    url: `${BASE_URL}/blog/category/${slugifyCategory(category)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const postEntries = posts.map(post => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated || post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...categoryEntries,
    ...postEntries,
  ];
}
