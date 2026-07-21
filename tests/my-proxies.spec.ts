import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{ name: 'token', value: 'test-token', url: 'http://localhost:3100' }]);
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
	let assignmentPolls = 0;
	let assigned = false;
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
		proxy_connected: assigned,
		proxy_label: assigned ? 'Бесплатный прокси #1' : undefined,
		proxy_type: assigned ? 'free_shared' : 'none',
		keeper_active: assigned,
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
		  assigned_account_id: assigned ? 81 : undefined,
		  assigned_username: assigned ? 'AlphaSeller' : undefined,
          created_at: '2026-07-21T00:00:00Z',
        }],
      });
	  if (path === '/api/proxies/my/95/assign' && method === 'POST') {
		(window as typeof window & { __PROXY_ASSIGN_PREFER__?: string | null }).__PROXY_ASSIGN_PREFER__ = new Headers(init?.headers).get('Prefer');
		assignmentPolls = 0;
		assigned = true;
		const started = new Date().toISOString();
		return ok({ operation: {
		  id: 'my-proxy-assignment',
		  kind: 'proxy_assign_and_restart',
		  status: 'queued',
		  attempt: 0,
		  max_attempts: 3,
		  created_at: started,
		  updated_at: started,
		} });
	  }
	  if (path === '/api/operations/my-proxy-assignment' && method === 'GET') {
		assignmentPolls += 1;
		const started = new Date(Date.now() - 250).toISOString();
		return ok({
		  id: 'my-proxy-assignment',
		  kind: 'proxy_assign_and_restart',
		  status: assignmentPolls < 2 ? 'running' : 'succeeded',
		  attempt: 1,
		  max_attempts: 3,
		  attempt_started_at: started,
		  attempt_deadline_at: new Date(new Date(started).getTime() + 45_000).toISOString(),
		  result: { account_id: 81, proxy_id: 95, assignment_applied: true, workers_started: true },
		  created_at: started,
		  updated_at: new Date().toISOString(),
		});
	  }
      return ok({});
    };
  });
});

test('inventory assignment uses the blocking asynchronous operation', async ({ page }) => {
  await page.goto('/platform/proxies');
  await page.getByRole('button', { name: 'Назначить' }).first().click();
  await page.locator('select').last().selectOption('81');
  await page.getByRole('button', { name: 'Назначить', exact: true }).last().click();

  const overlay = page.getByTestId('blocking-operation-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('Назначаем и проверяем прокси');
  await expect(overlay).toContainText('Попытка 1 из 3');
  await expect(page.getByTestId('blocking-operation-progress')).toHaveAttribute('data-duration-ms', '45000');
  await expect(overlay).toBeHidden();
  await expect(page.getByText('Назначен аккаунту', { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { __PROXY_ASSIGN_PREFER__?: string | null }).__PROXY_ASSIGN_PREFER__)).toBe('respond-async');
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
