import { getAllPosts } from '@/lib/blog';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = getAllPosts();
  const lastBuildDate = (posts[0]?.updated ?? posts[0]?.date ?? new Date().toISOString());

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Блог FunPay Cloud</title>
    <link>https://funpay.cloud/blog</link>
    <description>Руководства для продавцов FunPay</description>
    <language>ru</language>
    <lastBuildDate>${new Date(lastBuildDate).toUTCString()}</lastBuildDate>
    <atom:link href="https://funpay.cloud/rss.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>https://funpay.cloud/blog/${post.slug}</link>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid isPermaLink="true">https://funpay.cloud/blog/${post.slug}</guid>
    </item>`,
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
