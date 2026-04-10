import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Защита /platform/* — без токена редирект на /auth/login
  if (pathname.startsWith('/platform')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Если пользователь уже залогинен и заходит на страницы авторизации
  if ((pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')) && token) {
    return NextResponse.redirect(new URL('/platform/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/platform/:path*', '/auth/login', '/auth/register'],
};
