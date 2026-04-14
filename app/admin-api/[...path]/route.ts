import { NextRequest, NextResponse } from 'next/server';

const targetBase = (process.env.NEXT_ADMIN_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || 'https://api.funpay.cloud').replace(/\/+$/, '');

async function proxyToAdmin(request: NextRequest, params: { path?: string[] }) {
  const path = (params.path || []).join('/');
  const target = `${targetBase}/api/admin/${path}${request.nextUrl.search}`;

  const adminKey = process.env.ADMIN_SECRET_KEY || '';
  if (!adminKey) {
    return NextResponse.json({ success: false, error: 'ADMIN_SECRET_KEY is not configured' }, { status: 503 });
  }

  const headers = new Headers(request.headers);
  headers.set('X-Admin-Key', adminKey);
  headers.delete('host');

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const upstream = await fetch(target, init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyToAdmin(request, await context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyToAdmin(request, await context.params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyToAdmin(request, await context.params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyToAdmin(request, await context.params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyToAdmin(request, await context.params);
}
