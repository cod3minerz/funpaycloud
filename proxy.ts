import { NextRequest, NextResponse } from 'next/server';

const publicDocuments = new Set([
  '/robots.txt',
  '/sitemap.xml',
  '/sitemap-main.xml',
  '/sitemap-blog.xml',
  '/rss.xml',
  '/yandex_4967786c9a60a988.html',
  '/yandex_f009484553836fb1.html',
]);

const publicAssetPath = /^\/(?:branding|fonts|images)\/.+\.(?:avif|css|eot|gif|ico|jpe?g|js|mjs|png|svg|ttf|webp|woff2?)$/i;

function normalizePath(pathname: string): string {
  try {
    return decodeURIComponent(pathname).replace(/\\/g, '/').replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
  } catch {
    return pathname;
  }
}

function isPublicPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '/blog' || pathname.startsWith('/blog/')) return true;
  if (publicDocuments.has(pathname) || publicAssetPath.test(pathname)) return true;
  if (pathname.startsWith('/_next/')) return true;
  return false;
}

export function proxy(request: NextRequest) {
  const pathname = normalizePath(request.nextUrl.pathname);
  if (isPublicPath(pathname)) return NextResponse.next();

  return new NextResponse('Эта страница больше недоступна. FunPay Cloud сейчас обновляется: https://funpay.cloud/', {
    status: 410,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  });
}

export const config = {
  matcher: '/:path*',
};
