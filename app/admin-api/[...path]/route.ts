import { NextRequest, NextResponse } from 'next/server';

const targetBase = (process.env.NEXT_ADMIN_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || 'https://api.funpay.cloud').replace(/\/+$/, '');

async function proxyToAdmin(request: NextRequest, params: { path?: string[] }) {
  const path = (params.path || []).join('/');
  const target = `${targetBase}/api/admin/${path}${request.nextUrl.search}`;

  const adminKey = process.env.ADMIN_SECRET_KEY || '';
  if (!adminKey) {
    return NextResponse.json({ success: false, error: 'ADMIN_SECRET_KEY is not configured' }, { status: 503 });
  }

  // Forward only a minimal safe header set to avoid oversized headers and accidental duplication.
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');
  const auth = request.headers.get('authorization');
  const userAgent = request.headers.get('user-agent');
  const forwardedFor = request.headers.get('x-forwarded-for');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const realIP = request.headers.get('x-real-ip');

  if (contentType) headers.set('Content-Type', contentType);
  if (accept) headers.set('Accept', accept);
  if (auth) headers.set('Authorization', auth);
  if (userAgent) headers.set('User-Agent', userAgent);
  if (forwardedFor) headers.set('X-Forwarded-For', forwardedFor);
  if (forwardedProto) headers.set('X-Forwarded-Proto', forwardedProto);
  if (forwardedHost) headers.set('X-Forwarded-Host', forwardedHost);
  if (realIP) headers.set('X-Real-IP', realIP);

  // Ensure exactly one admin key header from server env.
  headers.delete('X-Admin-Key');
  headers.set('X-Admin-Key', adminKey);

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
