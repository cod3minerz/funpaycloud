import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('fp_access')?.value || request.cookies.get('token')?.value;
  const adminSession = request.cookies.get('admin_auth')?.value || request.cookies.get('admin_token')?.value;
  const legacyAdminToken = request.cookies.get('admin_token')?.value;
  const { pathname } = request.nextUrl;

  // Защита /platform/* — без токена редирект на /auth/login
  if (pathname.startsWith('/platform')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      if (adminSession) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      const response = NextResponse.next();
      if (legacyAdminToken) {
        response.cookies.set('admin_token', '', { path: '/', maxAge: 0 });
      }
      return response;
    }
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Если пользователь уже залогинен и заходит на страницы авторизации
  if ((pathname === '/login' || pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')) && token) {
    return NextResponse.redirect(new URL('/platform/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/platform/:path*', '/auth/login', '/auth/register', '/login', '/admin/:path*'],
};
