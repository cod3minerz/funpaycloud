import { expect, test, type Page } from '@playwright/test';

async function bootstrapNotifications(page: Page) {
  await page.context().addCookies([{ name: 'token', value: 'test-token', url: 'http://localhost:3100' }]);
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    const state = {
      items: [{
        id: 1,
        funpay_account_id: 8,
        type: 'system',
        title: 'Система',
        body: 'Готово',
        meta: {},
        is_read: false,
        created_at: '2026-07-23T10:00:00Z',
      }],
      lastType: '',
      marked: [] as number[],
    };
    (window as any).__notificationTest = {
      addIncoming() {
        state.items.unshift({
          id: 2,
          funpay_account_id: 8,
          type: 'new_message',
          title: 'Сообщение от DigitalRush',
          body: '1',
          meta: { account_id: 8, chat_id: 5, node_id: '252535735', cursor_id: 901, part_index: 0 },
          is_read: false,
          created_at: '2026-07-23T10:01:00Z',
        });
      },
      get lastType() { return state.lastType; },
      get marked() { return state.marked; },
    };

    const envelope = (data: unknown) => new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const raw = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(raw, window.location.origin);
      const method = (init?.method || 'GET').toUpperCase();
      if (!url.pathname.startsWith('/api/')) return originalFetch(input, init);
      if (url.pathname === '/api/auth/me') {
        return envelope({ id: 7, email: 'qa@test.local', plan: 'pro', accounts_count: 1 });
      }
      if (url.pathname === '/api/settings/profile') {
        return envelope({ login: 'qa', email: 'qa@test.local', is_admin: false });
      }
      if (url.pathname === '/api/notifications/unread-count') {
        return envelope({ count: state.items.filter(item => !item.is_read).length });
      }
      if (url.pathname === '/api/notifications' && method === 'GET') {
        state.lastType = url.searchParams.get('type') || '';
        const items = state.lastType ? state.items.filter(item => item.type === state.lastType) : state.items;
        return envelope({
          items,
          total: items.length,
          page: 1,
          unread: state.items.filter(item => !item.is_read).length,
        });
      }
      const readMatch = url.pathname.match(/^\/api\/notifications\/(\d+)\/read$/);
      if (readMatch && method === 'POST') {
        const id = Number(readMatch[1]);
        state.marked.push(id);
        const item = state.items.find(value => value.id === id);
        if (item) item.is_read = true;
        return envelope({});
      }
      if (url.pathname === '/api/accounts') return envelope([]);
      return envelope({});
    };
  });
}

test('notifications refresh, filter on server and open the referenced chat', async ({ page }) => {
  await bootstrapNotifications(page);
  await page.goto('/platform/notifications');
  await expect(page.getByRole('button', { name: 'Система', exact: true })).toBeVisible();

  await page.evaluate(() => {
    (window as any).__notificationTest.addIncoming();
    window.dispatchEvent(new Event('focus'));
  });
  await expect(page.getByText('Сообщение от DigitalRush')).toBeVisible();

  await page.getByRole('button', { name: 'Сообщения' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__notificationTest.lastType)).toBe('new_message');
  await expect(page.getByText('Готово', { exact: true })).toHaveCount(0);

  await page.getByText('Сообщение от DigitalRush').click();
  await expect(page).toHaveURL(/\/platform\/chats\?account_id=8&chat_id=5/);
  await expect.poll(() => page.evaluate(() => (window as any).__notificationTest.marked)).toContain(2);
});
