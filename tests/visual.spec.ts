import { expect, test, type Page } from '@playwright/test';

async function stabilize(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
      }
    `,
  });
}

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'token',
      value: 'test-token',
      url: 'http://localhost:3100',
    },
  ]);

  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');

    const accountID = 8;
    const chatID = 5;
    const nodeID = '252535735';
    const envelope = (data: unknown) =>
      new Response(JSON.stringify({ success: true, data }), {
        headers: { 'Content-Type': 'application/json' },
      });
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const rawURL = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(rawURL, window.location.origin);
      const path = url.pathname;
      const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET')).toUpperCase();

      if (!path.startsWith('/api/')) {
        return originalFetch(input, init);
      }
      if (path === '/api/auth/me') {
        return envelope({ id: 2, email: 'qa@test.local', is_verified: true, plan: 'trial', accounts_count: 1 });
      }
      if (path === '/api/dashboard') {
        return envelope({
          total_balance: 0,
          accounts_count: 1,
          orders_today: 0,
          orders_today_revenue: 0,
          active_lots: 0,
          unread_chats: 0,
          recent_orders: [],
          recent_chats: [],
        });
      }
      if (path === '/api/accounts' && method === 'GET') {
        return envelope([{ id: accountID, username: 'tonminerz', keeper_active: true, raiser_active: false }]);
      }
      if (path === `/api/accounts/${accountID}/chats/history` && method === 'GET') {
        return envelope([
          {
            id: chatID,
            funpay_account_id: accountID,
            node_id: nodeID,
            with_user: 'DigitalRush',
            last_message: 'Привет',
            unread: false,
            updated_at: '2026-04-14T10:00:00Z',
          },
        ]);
      }
      if (path.startsWith(`/api/chats/${chatID}/messages`) && method === 'GET') {
        return envelope([
          {
            id: 101,
            chat_id: chatID,
            author_id: 777,
            author_name: 'DigitalRush',
            text: 'Привет',
            is_my_msg: false,
            status: 'delivered',
            created_at: '2026-04-14T09:58:00Z',
          },
          {
            id: 102,
            chat_id: chatID,
            author_id: 19438965,
            author_name: 'tonminerz',
            text: 'Здравствуйте, уже проверяю заказ.',
            is_my_msg: true,
            status: 'delivered',
            created_at: '2026-04-14T10:00:00Z',
          },
        ]);
      }
      if (path === '/api/ws/token' && method === 'POST') {
        return envelope({ ticket: 'test-ticket' });
      }
      if (path === '/api/settings/subscription' && method === 'GET') {
        return envelope({ plan: 'pro', subscription_status: 'active_paid', days_left: 30 });
      }
      return envelope(method === 'GET' ? [] : {});
    };

    const NativeWebSocket = window.WebSocket;
    class MockWebSocket extends EventTarget {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      url: string;
      readyState = MockWebSocket.CONNECTING;
      bufferedAmount = 0;
      extensions = '';
      protocol = '';
      binaryType: BinaryType = 'blob';
      onopen: ((this: WebSocket, ev: Event) => any) | null = null;
      onerror: ((this: WebSocket, ev: Event) => any) | null = null;
      onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
      onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;

      constructor(url: string | URL) {
        super();
        this.url = String(url);
        setTimeout(() => {
          this.readyState = MockWebSocket.OPEN;
          const ev = new Event('open');
          this.dispatchEvent(ev);
          this.onopen?.call(this as unknown as WebSocket, ev);
        }, 0);
      }

      send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {}

      close() {
        this.readyState = MockWebSocket.CLOSED;
      }
    }

    const PatchedWebSocket = function (this: unknown, url: string | URL, protocols?: string | string[]) {
      const target = String(url);
      if (target.includes('/ws/')) {
        return new MockWebSocket(url);
      }
      return new NativeWebSocket(url, protocols as string | string[] | undefined);
    } as unknown as typeof WebSocket;

    PatchedWebSocket.prototype = NativeWebSocket.prototype;
    Object.defineProperty(PatchedWebSocket, 'CONNECTING', { value: NativeWebSocket.CONNECTING });
    Object.defineProperty(PatchedWebSocket, 'OPEN', { value: NativeWebSocket.OPEN });
    Object.defineProperty(PatchedWebSocket, 'CLOSING', { value: NativeWebSocket.CLOSING });
    Object.defineProperty(PatchedWebSocket, 'CLOSED', { value: NativeWebSocket.CLOSED });
    Object.defineProperty(window, 'WebSocket', {
      configurable: true,
      writable: true,
      value: PatchedWebSocket,
    });
  });
});

test('visual: dashboard desktop baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/platform/dashboard');
  await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible();
  await stabilize(page);
  await page.waitForTimeout(300);

  await expect(page.locator('.platform-main')).toHaveScreenshot('dashboard-desktop.png');
});

test('visual: dashboard mobile baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/platform/dashboard');
  await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible();
  await stabilize(page);
  await page.waitForTimeout(200);

  await expect(page).toHaveScreenshot('dashboard-mobile.png', { fullPage: true });
});

test('visual: chats mobile thread baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/platform/chats');
  await expect(page.getByRole('heading', { name: 'Чаты' })).toBeVisible();

  await page.getByTestId('chat-row').first().click();
  await expect(page.getByPlaceholder('Введите сообщение...')).toBeVisible();
  await stabilize(page);
  await page.waitForTimeout(200);

  await expect(page.getByTestId('chat-thread')).toHaveScreenshot('chats-mobile-thread.png');
});
