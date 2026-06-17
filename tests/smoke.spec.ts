import { expect, test, type Page } from '@playwright/test';

const PLATFORM_ROUTES = [
  '/platform/dashboard',
  '/platform/chats',
  '/platform/orders',
  '/platform/lots',
  '/platform/warehouse',
  '/platform/accounts',
  '/platform/analytics',
  '/platform/automation',
  '/platform/plugins',
  '/platform/finances',
  '/platform/settings',
];

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(0, doc.scrollWidth - window.innerWidth);
  });
  expect(overflow).toBeLessThanOrEqual(1);
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
    const accountID = 8;
    const chatID = 5;
    const nodeID = '252535735';
    const chat = {
      id: chatID,
      funpay_account_id: accountID,
      node_id: nodeID,
      with_user: 'DigitalRush',
      last_message: 'Привет',
      unread: false,
      updated_at: '2026-04-14T10:00:00Z',
    };
    const message = {
      id: 101,
      chat_id: chatID,
      author_id: 777,
      author_name: 'DigitalRush',
      text: 'Привет',
      is_my_msg: false,
      status: 'delivered',
      created_at: '2026-04-14T09:58:00Z',
    };
    const emptyAnalytics = {
      revenue: 0,
      orders_count: 0,
      avg_check: 0,
      conversion: 0,
      chart: [],
      top_products: [],
      hourly: [],
      top_buyers: [],
      by_accounts: [],
    };
    const emptyFinances = {
      total_revenue: 0,
      total_orders: 0,
      accounts_count: 1,
      transactions: [],
    };
    const profile = {
      login: 'qa',
      email: 'qa@test.local',
      telegram_linked: false,
      telegram_id: null,
      timezone: 'Europe/Moscow',
    };
    const notifications = {
      enabled: false,
      new_order: false,
      new_message: false,
      login: false,
      weekly_report: false,
      subscription: false,
    };
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
      if (path === '/api/auth/csrf') {
        return envelope({ csrf_token: 'test-csrf' });
      }
      if (path === '/api/auth/me') {
        return envelope({
          id: 2,
          email: 'qa@test.local',
          is_verified: true,
          plan: 'trial',
          accounts_count: 1,
        });
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
        return envelope([
          {
            id: accountID,
            username: 'tonminerz',
            keeper_active: true,
            raiser_active: false,
          },
        ]);
      }
      if (path === `/api/accounts/${accountID}/chats/history` && method === 'GET') {
        return envelope([chat]);
      }
      if (path.startsWith(`/api/chats/${chatID}/messages`) && method === 'GET') {
        return envelope([message]);
      }
      if (path === '/api/orders' && method === 'GET') {
        const mockOrders = (window as any).__MOCK_ORDERS__ ?? [];
        return envelope({
          orders: mockOrders,
          total: mockOrders.length,
          page: Number(url.searchParams.get('page') || 1),
          limit: Number(url.searchParams.get('limit') || 20),
        });
      }
      if (path === '/api/lots' && method === 'GET') {
        return envelope([]);
      }
      if (/^\/api\/accounts\/\d+\/lots(?:\/categories)?$/.test(path) && method === 'GET') {
        return envelope([]);
      }
      if (path === '/api/warehouse/lots' && method === 'GET') {
        return envelope((window as any).__MOCK_WAREHOUSE_LOTS__ ?? []);
      }
      if (path === '/api/analytics' && method === 'GET') {
        return envelope(emptyAnalytics);
      }
      if (path === '/api/automation' && method === 'GET') {
        return envelope([]);
      }
      if (path === '/api/plugins' && method === 'GET') {
        return envelope([]);
      }
      if (path === '/api/finances' && method === 'GET') {
        return envelope(emptyFinances);
      }
      if (path === '/api/billing/subscriptions/history' && method === 'GET') {
        return envelope({ items: [] });
      }
      if (path === '/api/settings/profile' && method === 'GET') {
        return envelope(profile);
      }
      if (path === '/api/settings/subscription' && method === 'GET') {
        return envelope({
          plan: 'pro',
          subscription_status: 'active_paid',
          days_left: 30,
        });
      }
      if (path === '/api/settings/notifications' && method === 'GET') {
        return envelope(notifications);
      }
      if (path === '/api/settings/telegram/link' && method === 'GET') {
        return envelope({ available: false, linked: false });
      }
      if (path === '/api/settings/referral' && method === 'GET') {
        return envelope({ referral_code: 'QA', referrals: [], total_earned: 0 });
      }
      if (path === '/api/ws/token' && method === 'POST') {
        return envelope({ ticket: 'test-ticket' });
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
          if (this.readyState !== MockWebSocket.CONNECTING) return;
          this.readyState = MockWebSocket.OPEN;
          const ev = new Event('open');
          this.dispatchEvent(ev);
          this.onopen?.call(this as unknown as WebSocket, ev);
        }, 0);
      }

      send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {}

      close(code = 1000, reason = '') {
        if (this.readyState === MockWebSocket.CLOSED) return;
        this.readyState = MockWebSocket.CLOSED;
        const ev = new CloseEvent('close', { code, reason, wasClean: code === 1000 });
        this.dispatchEvent(ev);
        this.onclose?.call(this as unknown as WebSocket, ev);
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

test('warehouse shows only available local stock items', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__MOCK_WAREHOUSE_LOTS__ = [
      {
        id: 301,
        funpay_account_id: 8,
        account_username: 'paidinfull',
        lot_id: 'lot-stock',
        title: 'Albion аккаунт',
        description: '',
        currency: 'RUB',
        category_name: 'Albion Online',
        node_id: 3486,
        node_type: 'lots',
        amount: 4,
        price: 5,
        is_active: true,
        auto_delivery_enabled: true,
        auto_delivery_template: '',
        stock_items: [
          { id: '2', value: 'тут ссылка2', status: 'available' },
          { id: '3', value: 'тут ссылка3', status: 'available' },
          { id: '4', value: 'тут ссылка4', status: 'available' },
        ],
      },
    ];
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/warehouse');
  await expect(page.getByText('3 доступно').first()).toBeVisible();
  await expect(page.getByText('4 доступно')).toHaveCount(0);
  await expect(page.getByText('тут ссылка1')).toHaveCount(0);
});

test('orders show delivered item after delivery history is recorded', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__MOCK_ORDERS__ = [
      {
        id: 901,
        funpay_account_id: 8,
        funpay_order_id: 'VBRZXCMQ',
        description: 'Albion Online, 1 шт.',
        price: 5,
        buyer_username: 'Haizenberg137',
        buyer_id: 137,
        status: 1,
        created_at: '2026-06-17T16:17:34Z',
        delivered_at: '2026-06-17T16:17:40Z',
        delivered_via: 'funpay_native_reconcile',
        delivered_item: 'тут ссылка1',
      },
    ];
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/orders');
  await expect(page.getByText('VBRZXCMQ')).toBeVisible();
  await expect(page.getByText('тут ссылка1')).toBeVisible();
});

test('desktop shell: no burger, stable sidebar collapse and no sidebar overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/dashboard');
  await expect(page.getByRole('heading', { name: 'Медиахаб платформы' })).toBeVisible();

  const sidebar = page.locator('aside').first();
  await expect(sidebar).toBeVisible();

  const collapseButton = page.getByRole('button', { name: 'Toggle Sidebar' }).first();
  await collapseButton.click();
  await expect(sidebar).toBeVisible();

  const hasSidebarOverflow = await sidebar.evaluate(el => el.scrollWidth > el.clientWidth + 1);
  expect(hasSidebarOverflow).toBeFalsy();
  await assertNoHorizontalOverflow(page);
});

test('mobile shell: only burger + drawer, no bottom bar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/platform/dashboard');
  await expect(page.getByRole('heading', { name: 'Медиахаб платформы' })).toBeVisible();

  const burger = page.getByRole('button', { name: 'Toggle Sidebar' }).first();
  await expect(burger).toBeVisible();

  await burger.click();
  await expect(page.locator('aside').first()).toHaveClass(/translate-x-0/);

  await expect(page.locator('.mobile-bottom-bar')).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
});

test('all /platform routes have no horizontal overflow on phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of PLATFORM_ROUTES) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalOverflow(page);
  }
});

test('mobile chats renders selected thread and composer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/platform/chats');
  await expect(page.getByRole('heading', { name: 'Чаты' })).toBeVisible();

  const firstChat = page.getByTestId('chat-row').first();
  await expect(firstChat).toBeVisible();

  await firstChat.click();
  const thread = page.getByTestId('chat-thread');
  await expect(thread).toBeVisible();
  await expect(thread.getByText('DigitalRush').first()).toBeVisible();
  await expect(page.getByPlaceholder('Введите сообщение...')).toBeVisible();

  await assertNoHorizontalOverflow(page);
});

test('desktop chats keeps split view list + thread', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/chats');

  await expect(page.getByTestId('chat-list')).toBeVisible();
  await expect(page.getByTestId('chat-thread')).toBeVisible();
  const composer = page.getByPlaceholder('Введите сообщение...');
  if (!(await composer.isVisible())) {
    await page.getByTestId('chat-row').first().click();
  }
  await expect(page.getByPlaceholder('Введите сообщение...')).toBeVisible();
});
