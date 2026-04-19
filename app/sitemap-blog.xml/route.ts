import { buildUrlSetXml, getBlogSitemapEntries } from '@/lib/sitemap-data';

export async function GET() {
  const xml = buildUrlSetXml(getBlogSitemapEntries());

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
