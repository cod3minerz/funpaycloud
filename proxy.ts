import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('fp_access')?.value || request.cookies.get('token')?.value;
  const refreshToken = request.cookies.get('fp_refresh')?.value;
  const token = accessToken || refreshToken;
  const adminSession = request.cookies.get('fp_admin')?.value || request.cookies.get('admin_auth')?.value || request.cookies.get('admin_token')?.value;
  const legacyAdminToken = request.cookies.get('admin_token')?.value;
  const { pathname } = request.nextUrl;

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
      response.cookies.set('admin_auth', '', { path: '/', maxAge: 0 });
      return response;
    }
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  if (
    (pathname === '/login' ||
      pathname.startsWith('/auth/login') ||
      pathname.startsWith('/auth/register') ||
      pathname.startsWith('/auth/forgot') ||
      pathname.startsWith('/auth/reset')) &&
    token
  ) {
    return NextResponse.redirect(new URL('/platform/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/platform/:path*', '/auth/login', '/auth/register', '/auth/forgot', '/auth/reset', '/login', '/admin/:path*'],
};
