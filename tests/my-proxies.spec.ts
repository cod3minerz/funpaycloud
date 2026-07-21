import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{ name: 'token', value: 'test-token', url: 'http://localhost:3100' }]);
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
	let assignmentPolls = 0;
	let assigned = false;
    let batchPolls = 0;
    let batchStartRequests = 0;
    let deleteBatchPolls = 0;
    let deleteBatchStartRequests = 0;
    const deletedProxyIDs = new Set<number>();
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
          can_delete: false,
          delete_block_reason: 'platform_owned',
        }, {
          id: 96,
          product: 'external_custom',
          label: 'Внешний прокси',
          display_name: '203.0.113.96:8080',
          host: '203.0.113.96',
          port: 8080,
          protocol: 'HTTPS',
          is_shared_free: false,
          has_credentials: true,
          is_active: true,
          health_status: 'healthy',
          fail_count: 0,
          created_at: '2026-07-20T00:00:00Z',
          can_delete: true,
        }, {
          id: 97,
          product: 'proxy_lite',
          label: 'Proxy Lite',
          display_name: 'Expired Proxy Lite',
          host: '203.0.113.97',
          port: 8080,
          protocol: 'HTTP',
          is_shared_free: false,
          has_credentials: false,
          is_active: false,
          health_status: 'expired',
          fail_count: 1,
          expires_at: '2026-07-20T00:00:00Z',
          created_at: '2026-06-20T00:00:00Z',
          can_delete: true,
        }, {
          id: 98,
          product: 'proxy_pro',
          label: 'Proxy Pro',
          display_name: 'Active Proxy Pro',
          host: '203.0.113.98',
          port: 8080,
          protocol: 'HTTP',
          is_shared_free: false,
          has_credentials: false,
          is_active: true,
          health_status: 'degraded',
          fail_count: 1,
          expires_at: '2030-08-20T00:00:00Z',
          created_at: '2026-06-20T00:00:00Z',
          can_delete: false,
          delete_block_reason: 'paid_not_expired',
        }, {
          id: 99,
          product: 'external_custom',
          label: 'Внешний прокси',
          display_name: 'Assigned External',
          host: '203.0.113.99',
          port: 8080,
          protocol: 'HTTP',
          is_shared_free: false,
          has_credentials: false,
          is_active: true,
          health_status: 'healthy',
          fail_count: 0,
          assigned_account_id: 81,
          assigned_username: 'AlphaSeller',
          created_at: '2026-06-20T00:00:00Z',
          can_delete: false,
          delete_block_reason: 'proxy_assigned',
        }].filter((item) => !deletedProxyIDs.has(item.id)),
      });
	  if (path === '/api/proxies/my/check-all' && method === 'POST') {
		batchStartRequests += 1;
		(window as typeof window & { __PROXY_BATCH_START_COUNT__?: number }).__PROXY_BATCH_START_COUNT__ = batchStartRequests;
		batchPolls = 0;
		const started = new Date().toISOString();
		return ok({ operation: {
		  id: 'proxy-check-batch',
		  kind: 'proxy_check_batch',
		  status: 'queued',
		  attempt: 0,
		  max_attempts: 1,
		  result: {},
		  created_at: started,
		  updated_at: started,
		} });
	  }
	  if (path === '/api/operations/proxy-check-batch' && method === 'GET') {
		batchPolls += 1;
		const started = new Date(Date.now() - 500).toISOString();
		const completed = batchPolls >= 4;
		const currentIndex = batchPolls === 1 ? 1 : batchPolls === 2 ? 2 : 36;
		const processed = completed ? 36 : batchPolls === 1 ? 0 : batchPolls === 2 ? 1 : 35;
		return ok({
		  id: 'proxy-check-batch',
		  kind: 'proxy_check_batch',
		  status: completed ? 'succeeded' : 'running',
		  attempt: 1,
		  max_attempts: 1,
		  result: {
			total: 36,
			processed,
			current_proxy_id: completed ? null : currentIndex === 1 ? 95 : currentIndex === 2 ? 96 : 98,
			current_proxy_name: completed ? '' : currentIndex === 36 ? 'Active Proxy Pro' : `Proxy ${currentIndex}`,
			current_index: completed ? 0 : currentIndex,
			healthy_count: completed ? 34 : Math.max(0, processed - 1),
			failed_count: completed ? 2 : 0,
			failed_proxy_ids: completed ? [97, 98] : [],
			failures: completed ? {
			  '97': { code: 'expired', message: 'Срок действия прокси истёк' },
			  '98': { code: 'connectivity_failed', message: 'Прокси не отвечает' },
			} : {},
			delete_eligible_count: completed ? 1 : 0,
			delete_blocked_count: completed ? 1 : 0,
		  },
		  created_at: started,
		  updated_at: new Date().toISOString(),
		  finished_at: completed ? new Date().toISOString() : undefined,
		});
	  }
	  if (path.startsWith('/api/proxies/my/') && method === 'DELETE') {
		const proxyID = Number(path.split('/').pop());
		await new Promise((resolve) => window.setTimeout(resolve, 150));
		deletedProxyIDs.add(proxyID);
		(window as typeof window & { __DELETED_PROXY_ID__?: number }).__DELETED_PROXY_ID__ = proxyID;
		return ok({ proxy_id: proxyID, deleted: true });
	  }
	  if (path === '/api/proxies/my/delete-failed' && method === 'POST') {
		const payload = JSON.parse(String(init?.body || '{}')) as { operation_id?: string; confirmation?: string };
		(window as typeof window & { __DELETE_FAILED_PAYLOAD__?: unknown }).__DELETE_FAILED_PAYLOAD__ = payload;
		(window as typeof window & { __DELETE_FAILED_PREFER__?: string | null }).__DELETE_FAILED_PREFER__ = new Headers(init?.headers).get('Prefer');
		deleteBatchStartRequests += 1;
		(window as typeof window & { __DELETE_BATCH_START_COUNT__?: number }).__DELETE_BATCH_START_COUNT__ = deleteBatchStartRequests;
		deleteBatchPolls = 0;
		const started = new Date().toISOString();
		return ok({ operation: {
		  id: 'proxy-delete-batch',
		  kind: 'proxy_delete_failed_batch',
		  status: 'queued',
		  attempt: 0,
		  max_attempts: 1,
		  result: { total: 2, processed: 0, deleted_ids: [], deleted_count: 0, skipped: [], skipped_count: 0 },
		  created_at: started,
		  updated_at: started,
		} });
	  }
	  if (path === '/api/operations/proxy-delete-batch' && method === 'GET') {
		deleteBatchPolls += 1;
		const completed = deleteBatchPolls >= 3;
		const processed = completed ? 2 : deleteBatchPolls === 1 ? 0 : 1;
		if (processed >= 1) deletedProxyIDs.add(97);
		return ok({
		  id: 'proxy-delete-batch',
		  kind: 'proxy_delete_failed_batch',
		  status: completed ? 'succeeded' : 'running',
		  attempt: 1,
		  max_attempts: 1,
		  result: {
			total: 2,
			processed,
			current_proxy_id: completed ? null : deleteBatchPolls === 1 ? 97 : 98,
			current_proxy_name: completed ? '' : deleteBatchPolls === 1 ? 'Expired Proxy Lite' : 'Active Proxy Pro',
			current_index: completed ? 0 : deleteBatchPolls,
			deleted_ids: processed >= 1 ? [97] : [],
			deleted_count: processed >= 1 ? 1 : 0,
			skipped: completed ? [{ proxy_id: 98, deleted: false, reason: 'paid_not_expired' }] : [],
			skipped_count: completed ? 1 : 0,
		  },
		  created_at: new Date(Date.now() - 500).toISOString(),
		  updated_at: new Date().toISOString(),
		  finished_at: completed ? new Date().toISOString() : undefined,
		});
	  }
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

test('checks every proxy sequentially and shows 1/36 through 36/36 progress', async ({ page }) => {
  await page.goto('/platform/proxies');
  await page.getByRole('button', { name: 'Проверить все прокси' }).evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });

  const overlay = page.getByTestId('proxy-check-batch-overlay');
  await expect(overlay).toBeVisible();
  await expect(page.getByTestId('proxy-check-batch-counter')).toHaveText('Прокси 1 из 36');
  await expect(page.getByTestId('proxy-check-batch-counter')).toHaveText('Прокси 36 из 36', { timeout: 5_000 });
  await expect(overlay).toBeHidden({ timeout: 5_000 });

  const summary = page.getByTestId('proxy-check-summary');
  await expect(summary).toContainText('Проверено 36 из 36');
  await expect(summary).toContainText('Работают: 34');
  await expect(summary).toContainText('Не прошли: 2');
  await expect(page.getByRole('button', { name: 'Удалить не прошедшие' })).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { __PROXY_BATCH_START_COUNT__?: number }).__PROXY_BATCH_START_COUNT__)).toBe(1);
});

test('restores an active batch check overlay after reload', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('fpcloud:proxy-check:active-operation', 'proxy-check-batch');
  });
  await page.goto('/platform/proxies');

  await expect(page.getByTestId('proxy-check-batch-overlay')).toBeVisible();
  await expect(page.getByTestId('proxy-check-batch-counter')).toContainText('из 36');
  await expect(page.getByTestId('proxy-check-batch-overlay')).toBeHidden({ timeout: 5_000 });
  await expect(page.getByTestId('proxy-check-summary')).toContainText('Проверено 36 из 36');
  expect(await page.evaluate(() => sessionStorage.getItem('fpcloud:proxy-check:active-operation'))).toBeNull();
});

test('shows delete only for eligible proxies and confirms a single deletion', async ({ page }) => {
  await page.goto('/platform/proxies');

  const freeRow = page.locator('[data-proxy-id="95"]').first();
  const externalRow = page.locator('[data-proxy-id="96"]').first();
  const expiredPaidRow = page.locator('[data-proxy-id="97"]').first();
  const activePaidRow = page.locator('[data-proxy-id="98"]').first();
  const assignedExternalRow = page.locator('[data-proxy-id="99"]').first();
  await expect(freeRow.getByRole('button', { name: 'Удалить' })).toHaveCount(0);
  await expect(externalRow.getByRole('button', { name: 'Удалить' })).toBeEnabled();
  await expect(expiredPaidRow.getByRole('button', { name: 'Удалить' })).toBeEnabled();
  await expect(activePaidRow.getByRole('button', { name: 'Удалить' })).toHaveCount(0);
  await expect(assignedExternalRow.getByRole('button', { name: 'Удалить' })).toBeDisabled();

  await externalRow.getByRole('button', { name: 'Удалить' }).click();
  const confirmation = page.getByRole('heading', { name: 'Удалить прокси?' }).locator('..');
  await expect(confirmation).toContainText('203.0.113.96:8080 · ID 96');
  await confirmation.getByRole('button', { name: 'Удалить', exact: true }).click();
  await expect(page.getByTestId('proxy-delete-overlay')).toBeVisible();
  await expect(page.getByTestId('proxy-delete-overlay')).toContainText('Удаляем прокси');
  await expect(page.locator('[data-proxy-id="96"]').first()).toHaveCount(0);
  await expect(page.getByTestId('proxy-delete-overlay')).toBeHidden();
  expect(await page.evaluate(() => (window as typeof window & { __DELETED_PROXY_ID__?: number }).__DELETED_PROXY_ID__)).toBe(96);
});

test('bulk deletion requires two confirmations and sends only the operation id', async ({ page }) => {
  await page.goto('/platform/proxies');
  await page.getByRole('button', { name: 'Проверить все прокси' }).click();
  await expect(page.getByTestId('proxy-check-batch-overlay')).toBeHidden({ timeout: 5_000 });

  await page.getByRole('button', { name: 'Удалить не прошедшие' }).click();
  const firstConfirmation = page.getByRole('heading', { name: 'Удалить не прошедшие проверку?' }).locator('..');
  await expect(firstConfirmation).toContainText('Доступны для удаления');
  await expect(firstConfirmation).toContainText('Будут пропущены');
  await firstConfirmation.getByRole('button', { name: 'Продолжить' }).click();

  const secondConfirmation = page.getByRole('heading', { name: 'Подтвердите массовое удаление' }).locator('..');
  const input = secondConfirmation.getByRole('textbox', { name: 'Контрольная фраза' });
  const deleteButton = secondConfirmation.getByRole('button', { name: 'Удалить прокси' });
  await expect(deleteButton).toBeDisabled();
  await input.fill('УДАЛИТЬ');
  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();

  const deleteOverlay = page.getByTestId('proxy-delete-overlay');
  await expect(deleteOverlay).toBeVisible();
  await expect(deleteOverlay).toContainText('Удаляем неработающие прокси');
  await expect(page.getByTestId('proxy-delete-batch-counter')).toHaveText('Прокси 1 из 2');
  await expect(page.getByTestId('proxy-delete-batch-counter')).toHaveText('Прокси 2 из 2', { timeout: 5_000 });
  await expect(deleteOverlay).toBeHidden({ timeout: 5_000 });

  expect(await page.evaluate(() => (window as typeof window & { __DELETE_FAILED_PAYLOAD__?: unknown }).__DELETE_FAILED_PAYLOAD__)).toEqual({
    operation_id: 'proxy-check-batch',
    confirmation: 'DELETE_FAILED_PROXIES',
  });
  expect(await page.evaluate(() => (window as typeof window & { __DELETE_FAILED_PREFER__?: string | null }).__DELETE_FAILED_PREFER__)).toBe('respond-async');
  expect(await page.evaluate(() => (window as typeof window & { __DELETE_BATCH_START_COUNT__?: number }).__DELETE_BATCH_START_COUNT__)).toBe(1);
  await expect(page.locator('[data-proxy-id="97"]').first()).toHaveCount(0);
});

test('restores batch deletion after reload and refreshes inventory on completion', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('fpcloud:proxy-delete:active-operation', 'proxy-delete-batch');
    sessionStorage.setItem('fpcloud:proxy-check:last-operation', 'proxy-check-batch');
  });
  await page.goto('/platform/proxies');

  await expect(page.getByTestId('proxy-delete-overlay')).toBeVisible();
  await expect(page.getByTestId('proxy-delete-batch-counter')).toContainText('из 2');
  await expect(page.getByTestId('proxy-delete-overlay')).toBeHidden({ timeout: 5_000 });
  await expect(page.locator('[data-proxy-id="97"]').first()).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem('fpcloud:proxy-delete:active-operation'))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem('fpcloud:proxy-check:last-operation'))).toBeNull();
});

test('batch and deletion actions remain usable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/platform/proxies');

  await expect(page.getByRole('button', { name: 'Проверить все прокси' })).toBeVisible();
  const expiredPaidCard = page.locator('[data-proxy-id="97"]').last();
  await expect(expiredPaidCard).toBeVisible();
  await expect(expiredPaidCard.getByRole('button', { name: 'Удалить' })).toBeVisible();
});
