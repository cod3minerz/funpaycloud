import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
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
    ],
    host: 'https://funpay.cloud',
  };
}
