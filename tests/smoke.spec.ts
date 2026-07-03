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
  '/platform/reviews',
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
    const initialParams = new URLSearchParams(window.location.search);
    const isAdmin = initialParams.get('admin') !== '0';
    const profile = {
      login: 'qa',
      email: 'qa@test.local',
      telegram_linked: false,
      telegram_id: null,
      timezone: 'Europe/Moscow',
      is_admin: isAdmin,
    };
    const weeklyInitiallyOn = initialParams.get('weeklyOn') === '1';
    const weeklyInitiallyFailed = initialParams.get('weeklyFailed') === '1';
    const reviewProxyReady = initialParams.get('proxy') !== '0';
    const reviewRuntimeReady = initialParams.get('runtime') !== '0';
    const reviewInitiallyEnabled = initialParams.get('reviewEnabled') === '1';
    const initialScanState = initialParams.get('scan') || 'waiting';
    let reviewStatusGets = 0;
    let reviewSettings = {
      enabled: reviewInitiallyEnabled,
      replies: {
        '1': { enabled: false, template: '' },
        '2': { enabled: false, template: '' },
        '3': { enabled: false, template: '' },
        '4': { enabled: false, template: '' },
        '5': { enabled: reviewInitiallyEnabled, template: reviewInitiallyEnabled ? 'Спасибо за отзыв!' : '' },
      },
    };
    let reviewStatus = {
      server_time: '2026-07-03T12:00:00Z',
      scan_state: initialScanState,
      scan_started_at: initialScanState === 'running' ? '2026-07-03T11:59:00Z' : null,
      scan_locked_until: initialScanState === 'running' ? '2026-07-03T12:29:00Z' : null,
      last_scan_status: initialScanState === 'error' ? 'error' : 'success',
      last_scan_error: initialScanState === 'error' ? 'profile fetch failed' : '',
      seconds_until_next_scan: initialScanState === 'due' ? 0 : 600,
      last_scan_at: '2026-07-03T11:45:00Z',
      next_scan_at: '2026-07-03T12:10:00Z',
      baselined_at: '2026-07-03T11:45:00Z',
      counts: {
        baseline: 1,
        pending: 0,
        replied: 0,
        skipped: 0,
        failed: 0,
      },
      recent: [
        {
          order_id: 'W9XD5V5M',
          buyer_funpay_user_id: 20334942,
          buyer_username: 'trevoga1111',
          rating: 5,
          status: 'baseline',
          skip_reason: 'initial_baseline',
          last_error: '',
          attempt_count: 0,
          detected_at: '2026-07-03T11:45:00Z',
          last_attempt_at: null,
          next_retry_at: null,
          replied_at: null,
          updated_at: '2026-07-03T11:45:00Z',
        },
      ],
      proxy_connected: reviewProxyReady,
      proxy_ready: reviewProxyReady,
      proxy_reason: reviewProxyReady ? '' : 'proxy_missing',
      runtime_ready: reviewRuntimeReady,
      runtime_reason: reviewRuntimeReady ? '' : 'runtime_unavailable',
    };
    const notifications = {
      enabled: weeklyInitiallyOn,
      new_order: false,
      new_message: false,
      login: false,
      weekly_report: weeklyInitiallyOn,
      subscription: false,
      weekly_report_day: 5,
      weekly_report_time: '10:00',
    };
    const weeklyReportStatus = {
      enabled: weeklyInitiallyOn,
      linked: true,
      timezone: 'Europe/Moscow',
      weekly_report_day: 5,
      weekly_report_time: '10:00',
      next_scheduled_for: weeklyInitiallyOn ? '2026-06-26T07:00:00Z' : null,
      next_scheduled_for_local: weeklyInitiallyOn ? '2026-06-26T10:00:00+03:00' : '',
      eligible: weeklyInitiallyOn,
      blocked_reason: weeklyInitiallyOn ? '' : 'weekly_report_disabled',
      last_run: weeklyInitiallyFailed
        ? {
            scheduled_for: '2026-06-19T07:00:00Z',
            period_start: '2026-06-12T07:00:00Z',
            period_end: '2026-06-19T07:00:00Z',
            status: 'failed',
            attempts: 2,
            sent_at: null,
            telegram_message_id: null,
            last_error: 'telegram api status=403',
          }
        : null,
    };
    (window as any).__LAST_NOTIFICATION_UPDATE__ = null;
    (window as any).__MOCK_WEEKLY_REPORT_STATUS__ = weeklyReportStatus;
    (window as any).__REVIEW_STATUS_GETS__ = 0;
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
            proxy_connected: reviewProxyReady,
            proxy_healthy: reviewProxyReady && reviewRuntimeReady,
          },
        ]);
      }
      if (path === `/api/accounts/${accountID}/review-settings` && method === 'GET') {
        return envelope(reviewSettings);
      }
      if (path === `/api/accounts/${accountID}/review-status` && method === 'GET') {
        reviewStatusGets += 1;
        (window as any).__REVIEW_STATUS_GETS__ = reviewStatusGets;
        reviewStatus = {
          ...reviewStatus,
          server_time: `2026-07-03T12:00:${String(Math.min(reviewStatusGets, 59)).padStart(2, '0')}Z`,
        };
        return envelope(reviewStatus);
      }
      if (path === `/api/accounts/${accountID}/review-scan` && method === 'POST') {
        if (!reviewSettings.enabled || !reviewStatus.proxy_ready) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'включите авто-ответы и прокси перед ручной проверкой',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        reviewStatus = {
          ...reviewStatus,
          scan_state: 'due',
          last_scan_status: 'queued',
          last_scan_error: '',
          seconds_until_next_scan: 0,
          next_scan_at: '2026-07-03T12:00:05Z',
        };
        return envelope(reviewStatus);
      }
      if (path === `/api/accounts/${accountID}/review-settings` && method === 'PUT') {
        const nextSettings = JSON.parse(String(init?.body || '{}'));
        if (nextSettings.enabled && !reviewStatus.proxy_ready) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'подключите активный прокси перед включением авто-ответов на отзывы',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        reviewSettings = nextSettings;
        reviewStatus = {
          ...reviewStatus,
          next_scan_at: reviewSettings.enabled ? '2026-07-03T12:10:00Z' : reviewStatus.next_scan_at,
        };
        return envelope(reviewSettings);
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
      if (path === '/api/settings/notifications/weekly-report/status' && method === 'GET') {
        return envelope((window as any).__MOCK_WEEKLY_REPORT_STATUS__);
      }
      if (path === '/api/settings/notifications' && method === 'GET') {
        return envelope(notifications);
      }
      if (path === '/api/settings/notifications' && method === 'PUT') {
        const body = JSON.parse(String(init?.body || '{}'));
        Object.assign(notifications, body);
        Object.assign((window as any).__MOCK_WEEKLY_REPORT_STATUS__, {
          enabled: Boolean(body.weekly_report),
          weekly_report_day: body.weekly_report_day ?? notifications.weekly_report_day,
          weekly_report_time: body.weekly_report_time ?? notifications.weekly_report_time,
          next_scheduled_for: body.weekly_report ? '2026-06-23T06:30:00Z' : null,
          next_scheduled_for_local: body.weekly_report ? '2026-06-23T09:30:00+03:00' : '',
          eligible: Boolean(body.weekly_report),
          blocked_reason: body.weekly_report ? '' : 'weekly_report_disabled',
          last_run: null,
        });
        (window as any).__LAST_NOTIFICATION_UPDATE__ = body;
        return envelope(body);
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

test('orders allow manual delivery for completed order without delivery history', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__MOCK_ORDERS__ = [
      {
        id: 902,
        funpay_account_id: 8,
        funpay_order_id: 'MXL5TDQL',
        description: 'Albion Online, 1 шт.',
        price: 3,
        buyer_username: 'Haizenberg137',
        buyer_id: 137,
        status: 1,
        created_at: '2026-06-18T11:34:47Z',
        delivered_at: null,
        delivered_via: '',
        delivered_item: '',
      },
    ];
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/orders');
  await expect(page.getByText('MXL5TDQL')).toBeVisible();
  const deliverButton = page.getByRole('button', { name: /Выдать/ }).first();
  await expect(deliverButton).toBeVisible();
  await expect(deliverButton).toBeEnabled();
});

test('weekly report toggle opens schedule modal and saves selected schedule', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/settings');

  const weeklyToggle = page.getByTestId('weekly-report-toggle');
  await expect(weeklyToggle).toBeVisible();
  await expect(weeklyToggle).toHaveAttribute('aria-pressed', 'false');

  await weeklyToggle.click();
  await expect(page.getByText('Выберите день и время отправки статистики.')).toBeVisible();
  await page.getByRole('button', { name: 'Отмена' }).click();
  await expect(page.getByText('Выберите день и время отправки статистики.')).toHaveCount(0);
  await expect(weeklyToggle).toHaveAttribute('aria-pressed', 'false');
  await expect
    .poll(() => page.evaluate(() => (window as any).__LAST_NOTIFICATION_UPDATE__ ?? null))
    .toBeNull();

  await weeklyToggle.click();
  await page.locator('select').selectOption('2');
  await page.locator('input[type="time"]').fill('09:30');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect
    .poll(() => page.evaluate(() => (window as any).__LAST_NOTIFICATION_UPDATE__ ?? null))
    .toMatchObject({
      enabled: true,
      weekly_report: true,
      weekly_report_day: 2,
      weekly_report_time: '09:30',
    });
  await expect(weeklyToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('weekly-report-next-run')).toContainText('Следующий отчёт');

  await page.evaluate(() => {
    (window as any).__LAST_NOTIFICATION_UPDATE__ = null;
  });
  await weeklyToggle.click();
  await expect(page.getByText('Выберите день и время отправки статистики.')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => (window as any).__LAST_NOTIFICATION_UPDATE__ ?? null))
    .toMatchObject({
      enabled: false,
      weekly_report: false,
    });
  await expect(weeklyToggle).toHaveAttribute('aria-pressed', 'false');
});

test('weekly report shows failed delivery status from backend', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/settings?weeklyOn=1&weeklyFailed=1');

  await expect(page.getByTestId('weekly-report-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('weekly-report-error')).toContainText('Ошибка отправки');
  await expect(page.getByTestId('weekly-report-error')).toContainText('telegram api status=403');
});

test('reviews require saved template before enabling switches', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/reviews');

  await expect(page.getByTestId('reviews-page')).toBeVisible();
  await expect(page.getByTestId('reviews-status')).toBeVisible();
  await expect(page.getByTestId('reviews-proxy-status')).toContainText('Прокси готов');
  await expect(page.getByTestId('reviews-runtime-status')).toContainText('Runtime готов');
  await expect(page.getByTestId('reviews-scan-state')).toContainText('Ожидает');
  await expect(page.getByTestId('reviews-baseline-hint')).toContainText('1 старых отзывов без автоответа');
  const textarea = page.getByTestId('reviews-template-5');
  const ratingToggle = page.getByTestId('reviews-rating-toggle-5');
  const globalToggle = page.getByTestId('reviews-global-toggle');
  const requestScan = page.getByTestId('reviews-request-scan');

  await expect(ratingToggle).toBeDisabled();
  await expect(globalToggle).toBeDisabled();
  await expect(requestScan).toBeDisabled();

  await textarea.fill('Спасибо за отзыв!');
  await expect(ratingToggle).toBeDisabled();

  await page.getByTestId('reviews-save').click();
  await expect(ratingToggle).toBeEnabled();
  await expect(globalToggle).toBeDisabled();

  await ratingToggle.click();
  await expect(ratingToggle).toHaveAttribute('aria-checked', 'true');
  await expect(globalToggle).toBeEnabled();

  await globalToggle.click();
  await expect(globalToggle).toHaveAttribute('aria-checked', 'true');
  await expect(requestScan).toBeEnabled();
  await requestScan.click();
  await expect(page.getByTestId('reviews-scan-state')).toContainText('Пора проверить');
  await expect(page.getByTestId('reviews-next-scan-countdown')).toContainText('сейчас');
});

test('reviews status refreshes on focus and shows scan diagnostics', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/reviews');

  await expect(page.getByTestId('reviews-status')).toBeVisible();
  await expect(page.getByTestId('reviews-status-updated')).toContainText('Обновлено');
  await expect(page.getByTestId('reviews-last-scan')).toContainText('03.07');
  await expect(page.getByTestId('reviews-scan-lock')).toContainText('—');

  const before = await page.evaluate(() => (window as any).__REVIEW_STATUS_GETS__);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect
    .poll(() => page.evaluate(() => (window as any).__REVIEW_STATUS_GETS__))
    .toBeGreaterThan(before);
});

test('reviews renders error and running scan states', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/reviews?scan=error');
  await expect(page.getByTestId('reviews-scan-state')).toContainText('Ошибка');
  await expect(page.getByTestId('reviews-last-error')).toContainText('profile fetch failed');

  await page.goto('/platform/reviews?reviewEnabled=1&scan=running');
  await expect(page.getByTestId('reviews-scan-state')).toContainText('Выполняется');
  await expect(page.getByTestId('reviews-request-scan')).toBeDisabled();
});

test('reviews global switch stays blocked without proxy', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/reviews?proxy=0');

  await expect(page.getByTestId('reviews-page')).toBeVisible();
  await expect(page.getByTestId('reviews-proxy-status')).toContainText('Подключите прокси');

  const textarea = page.getByTestId('reviews-template-5');
  const ratingToggle = page.getByTestId('reviews-rating-toggle-5');
  const globalToggle = page.getByTestId('reviews-global-toggle');

  await textarea.fill('Спасибо за отзыв!');
  await page.getByTestId('reviews-save').click();
  await expect(ratingToggle).toBeEnabled();

  await ratingToggle.click();
  await expect(ratingToggle).toHaveAttribute('aria-checked', 'true');
  await expect(globalToggle).toBeDisabled();
});

test('reviews page redirects non-admin user', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/reviews?admin=0');
  await expect(page).toHaveURL(/\/platform\/dashboard/);
});

test('telegram master toggle does not enable weekly report', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/settings');

  const masterToggle = page.getByTestId('telegram-notifications-master-toggle');
  const weeklyToggle = page.getByTestId('weekly-report-toggle');
  await expect(masterToggle).toBeVisible();
  await expect(weeklyToggle).toHaveAttribute('aria-pressed', 'false');

  await masterToggle.click();
  await expect(page.getByText('Выберите день и время отправки статистики.')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => (window as any).__LAST_NOTIFICATION_UPDATE__ ?? null))
    .toMatchObject({
      enabled: true,
      new_order: true,
      new_message: true,
      login: true,
      subscription: true,
      weekly_report: false,
    });
  await expect(weeklyToggle).toHaveAttribute('aria-pressed', 'false');
});

test('weekly report schedule modal is visible on phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/platform/settings');

  await page.getByTestId('weekly-report-toggle').click();
  const modal = page.getByTestId('weekly-report-schedule-modal');
  await expect(modal).toBeVisible();
  await expect(page.getByText('Выберите день и время отправки статистики.')).toBeVisible();
  await expect(page.locator('select')).toBeVisible();
  await expect(page.locator('input[type="time"]')).toBeVisible();

  const box = await modal.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
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
