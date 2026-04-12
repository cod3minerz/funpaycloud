'use client';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  // Также сохраняем в cookie для middleware
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  document.cookie = 'token=; path=/; max-age=0';
  window.location.href = '/login';
}
