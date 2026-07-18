import { expect, test } from '@playwright/test';

function operation(id: string, status: string, attempt = 1) {
  const started = new Date(Date.now() - 100).toISOString();
  return {
    id,
    kind: 'runtime_start',
    status,
    attempt,
    max_attempts: 3,
    attempt_started_at: started,
    attempt_deadline_at: new Date(new Date(started).getTime() + 45_000).toISOString(),
    error_code: '',
    error_message: '',
    result: status === 'succeeded' ? { account_id: 91 } : {},
    created_at: started,
    updated_at: new Date().toISOString(),
  };
}

test('admin Runner start uses the shared blocking operation overlay', async ({ page }) => {
  let polls = 0;
  let prefer = '';
  await page.route('**/admin-api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const ok = (data: unknown, status = 200) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data }),
    });
    if (path === '/admin-api/runners' && method === 'GET') {
      return ok([{ account_id: 91, username: 'AdminTest', user_id: 7, runner_active: false, keeper_active: false, raiser_active: false }]);
    }
    if (path === '/admin-api/runners/91/restart' && method === 'POST') {
      prefer = request.headers()['prefer'] || '';
      return ok({ operation: operation('admin-operation', 'queued', 0) }, 202);
    }
    if (path === '/admin-api/runners/operations/admin-operation') {
      polls += 1;
      return ok(operation('admin-operation', polls < 2 ? 'running' : 'succeeded'));
    }
    if (path === '/admin-api/feedback/counts') return ok({});
    return ok({});
  });

  await page.goto('/ops/runners');
  await page.getByRole('button', { name: 'Включить' }).click();
  const overlay = page.getByTestId('blocking-operation-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('Запускаем Runner');
  await expect(overlay).toContainText('Попытка 1 из 3');
  await expect(overlay).toBeHidden();
  expect(prefer).toBe('respond-async');
});

test('Telegram Mini App Runner start uses the shared blocking operation overlay', async ({ page }) => {
  let polls = 0;
  let prefer = '';
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const ok = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
    if (path === '/api/miniapp/session') return ok({ linked: true, token: 'mini-token', user: { id: 7, email: 'mini@test', name: 'Mini', plan: 'pro', subscription_status: 'active' } });
    if (path === '/api/miniapp/pulse') return ok({ status: 'ok', message: 'ok', accounts_total: 1, accounts_running: 0, attention_count: 0, orders_total: 0, unread_chats: 0, subscription: { plan: 'pro', status: 'active' }, accounts: [], proxies: [], attention_items: [] });
    if (path === '/api/miniapp/attention') return ok({ items: [] });
    if (path === '/api/miniapp/accounts' && method === 'GET') return ok({ items: [{ id: 91, username: 'MiniTest', runner_active: false, keeper_active: false, raiser_active: false, runtime_active: false, proxy_label: 'Proxy', proxy_connected: true }] });
    if (path === '/api/miniapp/proxies') return ok({ items: [] });
    if (path === '/api/miniapp/bonuses') return ok({ subscription: { plan: 'pro', status: 'active' }, promo_items: [] });
    if (path === '/api/miniapp/accounts/91/runtime/start' && method === 'POST') {
      prefer = request.headers()['prefer'] || '';
      return ok({ operation: operation('mini-operation', 'queued', 0) }, 202);
    }
    if (path === '/api/miniapp/operations/mini-operation') {
      polls += 1;
      return ok(operation('mini-operation', polls < 2 ? 'running' : 'succeeded'));
    }
    return ok({});
  });

  await page.goto('/miniapp#tgWebAppData=query_id%3Dtest%26auth_date%3D1784400000%26hash%3Dtest');
  await page.getByText('Аккаунты', { exact: true }).last().click();
  await page.getByRole('button', { name: 'Старт' }).click();
  const overlay = page.getByTestId('blocking-operation-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('Запускаем Runner');
  await expect(overlay).toBeHidden();
  expect(prefer).toBe('respond-async');
});
