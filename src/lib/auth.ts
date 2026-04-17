'use client';

const USER_TOKEN_KEY = 'token';
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_AUTH_COOKIE = 'admin_auth';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_TOKEN_KEY, token);
  // Также сохраняем в cookie для middleware
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_TOKEN_KEY);
  document.cookie = 'token=; path=/; max-age=0';
  window.location.href = '/login';
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
