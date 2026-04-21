'use client';

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_AUTH_COOKIE = 'admin_auth';

export function getToken(): string | null {
  return null;
}

export function setToken(_token: string): void {
  // cookie-first auth: user access token хранится только в HttpOnly cookie от backend.
}

export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some(part => part.trim().startsWith('fp_access='));
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const row = document.cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`));
  return row ? decodeURIComponent(row.split('=').slice(1).join('=')) : '';
}

async function ensureCsrfToken(apiBase: string): Promise<string> {
  let csrf = getCookie('fp_csrf');
  if (csrf) return csrf;

  try {
    const response = await fetch(`${apiBase}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
    });
    if (!response.ok) return '';
    const payload = (await response.json()) as { success?: boolean; data?: { csrf_token?: string } };
    csrf = payload?.data?.csrf_token || getCookie('fp_csrf');
    return csrf || '';
  } catch {
    return '';
  }
}

function clearClientSideAuthMarkers(): void {
  const cookieVariants = [
    'fp_access=; path=/; max-age=0',
    'fp_refresh=; path=/; max-age=0',
    'fp_csrf=; path=/; max-age=0',
    'token=; path=/; max-age=0',
    'fp_access=; path=/; max-age=0; domain=.funpay.cloud',
    'fp_refresh=; path=/; max-age=0; domain=.funpay.cloud',
    'fp_csrf=; path=/; max-age=0; domain=.funpay.cloud',
    'token=; path=/; max-age=0; domain=.funpay.cloud',
  ];
  cookieVariants.forEach(value => {
    document.cookie = value;
  });
}

export function logout(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.funpay.cloud';
  void (async () => {
    const csrf = await ensureCsrfToken(apiBase);
    try {
      await fetch(`${apiBase}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: csrf ? { 'X-CSRF-Token': csrf } : undefined,
      });
    } finally {
      clearClientSideAuthMarkers();
      window.location.href = '/auth/login';
    }
  })();
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  // Keep only a tiny marker cookie for middleware redirects, not full JWT.
  document.cookie = `${ADMIN_AUTH_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  // Cleanup legacy cookie that stored full admin JWT.
  document.cookie = 'admin_token=; path=/; max-age=0';
}

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  document.cookie = `${ADMIN_AUTH_COOKIE}=; path=/; max-age=0`;
  document.cookie = 'admin_token=; path=/; max-age=0';
}

export function logoutAdmin(): void {
  if (typeof window === 'undefined') return;
  clearAdminToken();
  window.location.href = '/admin/login';
}
