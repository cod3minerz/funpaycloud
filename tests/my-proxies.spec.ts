import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{ name: 'token', value: 'test-token', url: 'http://localhost:3100' }]);
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
    const ok = (data: unknown) => json({ success: true, data });
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const rawURL = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(rawURL, window.location.origin).pathname;
      const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET')).toUpperCase();
      if (!path.startsWith('/api/')) return originalFetch(input, init);
      if (path === '/api/auth/csrf') return ok({ csrf_token: 'csrf' });
      if (path === '/api/auth/me') return ok({ id: 7, email: 'qa@test.local', plan: 'pro', accounts_count: 1 });
      if (path === '/api/settings/profile') return ok({ login: 'qa', email: 'qa@test.local', is_admin: false });
      if (path === '/api/notifications/unread-count') return ok({ count: 0 });
      if (path === '/api/accounts' && method === 'GET') return ok([{
        id: 81,
        username: 'AlphaSeller',
        funpay_user_id: 8101,
        proxy_connected: false,
        proxy_type: 'none',
        keeper_active: false,
      }]);
      if (path === '/api/proxies/my' && method === 'GET') return ok({
        free_trial: { status: 'active', proxy_id: 95, expires_at: '2030-07-25T12:30:00Z' },
        items: [{
          id: 95,
          product: 'free_shared',
          label: 'Бесплатный прокси',
          display_name: 'Бесплатный прокси #1',
          host: 'platform.internal',
          port: 9005,
          protocol: 'HTTP',
          is_shared_free: true,
          has_credentials: false,
          is_active: true,
          health_status: 'healthy',
          fail_count: 0,
          expires_at: '2030-07-25T12:30:00Z',
          created_at: '2026-07-21T00:00:00Z',
        }],
      });
      return ok({});
    };
  });
});

test('active platform free lease is shown with its deadline and can be assigned', async ({ page }) => {
  await page.goto('/platform/proxies');
  await expect(page.getByRole('heading', { name: 'Мои прокси' })).toBeVisible();
  await expect(page.getByText('Бесплатный прокси #1', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Пока назначен', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/25 июл\. 2030/).first()).toBeVisible();
  await expect(page.getByText('Свободен до конца аренды', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Назначить' }).first()).toBeVisible();
  await expect(page.getByText('Доступы скрыты, это ресурс сервиса.', { exact: true }).first()).toBeVisible();
});
