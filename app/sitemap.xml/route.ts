import { buildSitemapIndexXml } from '@/lib/sitemap-data';

const SITEMAP_PATHS = ['/sitemap-main.xml', '/sitemap-blog.xml', '/sitemap-legal.xml'] as const;

export async function GET() {
  const xml = buildSitemapIndexXml([...SITEMAP_PATHS]);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
