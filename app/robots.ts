import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/platform',
          '/platform/',
          '/auth',
          '/auth/',
          '/login',
          '/admin-api/',
          '/api/',
          '/*?*utm_*',
          '/*?*gclid=*',
          '/*?*fbclid=*',
          '/*?*ysclid=*',
          '/*?*openstat=*',
        ],
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        crawlDelay: 1,
        disallow: [
          '/admin',
          '/admin/',
          '/platform',
          '/platform/',
          '/auth',
          '/auth/',
          '/login',
          '/admin-api/',
          '/api/',
          '/*?*utm_*',
          '/*?*gclid=*',
          '/*?*fbclid=*',
          '/*?*ysclid=*',
          '/*?*openstat=*',
        ],
      },
    ],
    sitemap: [
      'https://funpay.cloud/sitemap.xml',
      'https://funpay.cloud/sitemap-main.xml',
      'https://funpay.cloud/sitemap-blog.xml',
      'https://funpay.cloud/sitemap-legal.xml',
      'https://funpay.cloud/rss.xml',
    ],
    host: 'https://funpay.cloud',
  };
}
