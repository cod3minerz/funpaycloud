import { expect, test, type Page } from '@playwright/test';

const TEST_GOLDEN_KEY = 'FreshKeyForBrowserTest1234';

type AddFailure = {
  status: number;
  code: string;
  message: string;
  clearsKey: boolean;
};

const ADD_FAILURES: AddFailure[] = [
  {
    status: 422,
    code: 'invalid_golden_key',
    message: 'Golden Key недействителен или сессия FunPay истекла. Получите новый ключ и попробуйте снова.',
    clearsKey: true,
  },
  {
    status: 409,
    code: 'funpay_account_already_linked',
    message: 'Этот Golden Key относится к FunPay-аккаунту, уже привязанному к другому профилю FunPay Cloud. Войдите в нужный аккаунт FunPay и получите его новый Golden Key.',
    clearsKey: true,
  },
  {
    status: 503,
    code: 'funpay_unavailable',
    message: 'FunPay временно недоступен. Повторите попытку через несколько секунд.',
    clearsKey: false,
  },
  {
    status: 504,
    code: 'funpay_validation_timeout',
    message: 'FunPay не ответил вовремя. Повторите попытку через несколько секунд.',
    clearsKey: false,
  },
  {
    status: 503,
    code: 'selected_proxy_unavailable',
    message: 'Выбранный прокси недоступен. Проверьте его или выберите другой.',
    clearsKey: false,
  },
];

async function openAddAccount(page: Page) {
  await page.getByRole('button', { name: 'Добавить аккаунт', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Новый аккаунт' })).toBeVisible();
  await expect(page.getByTestId('onboarding-proxy-picker')).toBeVisible();
}

async function chooseFreeProxy(page: Page) {
  await page.getByRole('button', { name: /Бесплатный прокси/ }).click();
  await expect(page.getByTestId('free-proxy-claimed-notice')).toBeVisible();
  await page.getByRole('button', { name: 'Выбрать со склада' }).click();
  await page.getByTestId('owned-proxy-list').getByRole('button').filter({ hasText: 'Бесплатный прокси #1' }).click();
  await expect(page.getByTestId('golden-key-input')).toBeVisible();
  await expect(page.getByTestId('selected-onboarding-proxy')).toContainText('Бесплатный прокси');
}

async function openOwnProxyActions(page: Page) {
  const alphaRow = page.getByRole('row').filter({ hasText: 'AlphaSeller' });
  await alphaRow.getByRole('button', { name: 'Сменить прокси' }).click();
  await expect(page.getByTestId('change-proxy-catalog')).toBeVisible();
  await page.getByRole('button', { name: 'Выбрать', exact: true }).click();
  await expect(page.getByTestId('own-proxy-actions')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{
    name: 'token',
    value: 'test-token',
    url: 'http://localhost:3100',
  }]);

  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    const params = new URLSearchParams(window.location.search);
    if (params.get('dark') === '1') localStorage.setItem('theme', 'dark');
    const addError = params.get('addError');
    const slowComplete = params.get('slowComplete') === '1';
    const holdCompleteRequest = params.get('holdCompleteRequest') === '1';
    const retryFlow = params.get('retryFlow') === '1';
    const preserveExisting = params.get('preserveExisting') === '1';
    const startEmpty = params.get('empty') === '1';
    const startStopped = params.get('stopped') === '1';
    const dropTarget = params.get('dropTarget') === '1';
    const emptyInventory = params.get('emptyInventory') === '1';
    const inventoryErrorOnce = params.get('inventoryErrorOnce') === '1';
    const assignError = params.get('assignError') === '1';
    const assignWorkerError = params.get('assignWorkerError') === '1';
    const assignRetryFlow = params.get('assignRetryFlow') === '1';
    const externalProxyError = params.get('externalProxyError') === '1';
    const freeOn = params.get('freeOn');
    const requestedFreeTrial = params.get('freeTrial');
    const previouslyUsedFree = requestedFreeTrial === 'expired';
    let freeTrialStatus: 'available' | 'active' | 'renewal_due' = requestedFreeTrial === 'renewal_due'
      ? 'renewal_due'
      : freeOn === 'alpha' || freeOn === 'beta' || requestedFreeTrial === 'active'
        ? 'active'
        : 'available';
    let accounts = startEmpty ? [] : [
      {
        id: 81,
        funpay_user_id: 8101,
        username: 'AlphaSeller',
        runner_active: true,
        keeper_active: true,
        raiser_active: false,
        proxy_connected: false,
        proxy_type: 'none',
      },
      {
        id: 82,
        funpay_user_id: 8201,
        username: 'BetaSeller',
        runner_active: true,
        keeper_active: true,
        raiser_active: false,
        proxy_connected: true,
        proxy_label: 'Индивидуальный прокси',
        proxy_type: 'individual',
      },
    ];
    if (freeOn === 'alpha' || freeOn === 'beta') {
      const freeAccountID = freeOn === 'alpha' ? 81 : 82;
      accounts = accounts.map((account) => account.id === freeAccountID
        ? {
            ...account,
            proxy_connected: true,
            proxy_label: 'Бесплатный прокси #1',
            proxy_type: 'free_shared',
          }
        : account);
    }
    if (startStopped) {
      accounts = accounts.map((account) => ({ ...account, runner_active: false, keeper_active: false, raiser_active: false }));
    }
    let operationPolls = 0;
    let activeOperationKind: 'add' | 'runner' | 'batch' | 'proxy' | null = null;
    const failures: Record<string, { status: number; message: string }> = {
      invalid_golden_key: { status: 422, message: 'Golden Key недействителен или сессия FunPay истекла. Получите новый ключ и попробуйте снова.' },
      funpay_account_already_linked: { status: 409, message: 'Этот Golden Key относится к FunPay-аккаунту, уже привязанному к другому профилю FunPay Cloud. Войдите в нужный аккаунт FunPay и получите его новый Golden Key.' },
      funpay_unavailable: { status: 503, message: 'FunPay временно недоступен. Повторите попытку через несколько секунд.' },
      funpay_validation_timeout: { status: 504, message: 'FunPay не ответил вовремя. Повторите попытку через несколько секунд.' },
      selected_proxy_unavailable: { status: 503, message: 'Выбранный прокси недоступен. Проверьте его или выберите другой.' },
    };
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
    const ok = (data: unknown, status = 200) => json({ success: true, data }, status);
    const originalFetch = window.fetch.bind(window);
    const testScope = window as typeof window & {
      __PROXY_CONNECT_CALLS__?: number;
      __PROXY_CONNECT_BODY__?: Record<string, unknown>;
      __OWNED_PROXY_ASSIGN_CALLS__?: number;
      __OWNED_PROXY_ASSIGN_BODY__?: Record<string, unknown>;
      __DROP_PROXY_TARGET_NOW__?: boolean;
      __LEGACY_ACCOUNT_POSTS__?: number;
      __ONBOARDING_CANCELS__?: number;
      __ASYNC_PREFER_CALLS__?: number;
      __ONBOARDING_COMPLETE_RESOLVED__?: boolean;
      __RELEASE_ONBOARDING_COMPLETE__?: () => void;
      __INVENTORY_CALLS__?: number;
      __ONBOARDING_REQUESTS__?: Record<string, unknown>[];
      __FREE_CLAIM_CALLS__?: number;
    };
    testScope.__PROXY_CONNECT_CALLS__ = 0;
    testScope.__PROXY_CONNECT_BODY__ = undefined;
    testScope.__OWNED_PROXY_ASSIGN_CALLS__ = 0;
    testScope.__OWNED_PROXY_ASSIGN_BODY__ = undefined;
    testScope.__DROP_PROXY_TARGET_NOW__ = false;
    testScope.__LEGACY_ACCOUNT_POSTS__ = 0;
    testScope.__ONBOARDING_CANCELS__ = 0;
    testScope.__ASYNC_PREFER_CALLS__ = 0;
    testScope.__ONBOARDING_COMPLETE_RESOLVED__ = false;
    testScope.__INVENTORY_CALLS__ = 0;
    testScope.__ONBOARDING_REQUESTS__ = [];
    testScope.__FREE_CLAIM_CALLS__ = 0;

    const session = (id: string, type: string, label: string, status = 'ready', product?: string) => ({
      id,
      status,
      expires_at: '2030-07-19T00:00:00Z',
      proxy: { id: status === 'ready' ? 501 : undefined, type, product, label },
      next_action: status === 'ready'
        ? 'enter_golden_key'
        : status === 'awaiting_payment'
          ? 'pay'
          : status === 'failed'
            ? 'payment_failed'
            : 'wait',
    });
    const operation = (
      id: string,
      status: string,
      attempt: number,
      errorCode = '',
      errorMessage = '',
      result: Record<string, unknown> = {},
    ) => {
      const started = new Date(Date.now() - 250).toISOString();
      return {
        id,
        kind: activeOperationKind === 'add'
          ? 'account_onboarding_complete'
          : activeOperationKind === 'batch'
            ? 'runtime_start_batch'
            : activeOperationKind === 'proxy'
              ? 'proxy_assign_and_restart'
              : 'runtime_start',
        status,
        attempt,
        max_attempts: 3,
        attempt_started_at: started,
        attempt_deadline_at: new Date(new Date(started).getTime() + 45_000).toISOString(),
        next_retry_at: status === 'retry_wait' ? new Date(Date.now() + 1000).toISOString() : null,
        error_code: errorCode,
        error_message: errorMessage,
        result,
        created_at: started,
        updated_at: new Date().toISOString(),
      };
    };

    let inventoryCalls = 0;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const rawURL = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(rawURL, window.location.origin);
      const path = url.pathname;
      const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET')).toUpperCase();
      if (!path.startsWith('/api/')) return originalFetch(input, init);

      if (path === '/api/auth/csrf') return ok({ csrf_token: 'test-csrf' });
      if (path === '/api/auth/me') return ok({ id: 7, email: 'qa@test.local', plan: 'pro', accounts_count: accounts.length });
      if (path === '/api/settings/profile') return ok({ login: 'qa', email: 'qa@test.local', is_admin: false, telegram_linked: true });
      if (path === '/api/notifications/unread-count') return ok({ count: 0 });
      if (path === '/api/accounts' && method === 'GET') {
        const visibleAccounts = dropTarget && testScope.__DROP_PROXY_TARGET_NOW__
          ? accounts.filter((account) => account.id !== 81)
          : accounts;
        return ok(visibleAccounts);
      }
      if (path === '/api/accounts' && method === 'POST') {
        testScope.__LEGACY_ACCOUNT_POSTS__ = (testScope.__LEGACY_ACCOUNT_POSTS__ || 0) + 1;
        return json({ success: false, error: 'legacy endpoint must not be called' }, 500);
      }
      if (path === '/api/proxies/my' && method === 'GET') {
        inventoryCalls += 1;
        testScope.__INVENTORY_CALLS__ = inventoryCalls;
        if (inventoryErrorOnce && inventoryCalls === 2) {
          return json({ success: false, error: 'Не удалось загрузить инвентарь' }, 503);
        }
        if (emptyInventory) return ok({ items: [], free_trial: { status: freeTrialStatus, previously_used: previouslyUsedFree } });
        const freeAccount = accounts.find((account) => account.proxy_type === 'free_shared');
        return ok({ items: [
          {
            id: 91,
            product: 'proxy_lite',
            label: 'Proxy Lite',
            display_name: 'Купленный Proxy Lite',
            host: 'paid-proxy.local',
            port: 9001,
            protocol: 'HTTP',
            is_shared_free: false,
            has_credentials: true,
            is_active: true,
            health_status: 'healthy',
            fail_count: 0,
            expires_at: '2030-07-18T00:00:00Z',
            created_at: '2026-07-18T00:00:00Z',
          },
          {
            id: 97,
            product: 'proxy_lite',
            label: 'Proxy Lite',
            display_name: 'Текущий Proxy Lite',
            host: 'current-paid-proxy.local',
            port: 9007,
            protocol: 'HTTP',
            is_shared_free: false,
            has_credentials: true,
            is_active: true,
            health_status: 'healthy',
            fail_count: 0,
            expires_at: '2030-07-18T00:00:00Z',
            assigned_account_id: 81,
            assigned_username: 'AlphaSeller',
            created_at: '2026-07-17T00:00:00Z',
          },
          {
            id: 98,
            product: 'proxy_pro',
            label: 'Proxy Pro',
            display_name: 'Свободный Proxy Pro',
            host: 'available-proxy-pro.local',
            port: 9008,
            protocol: 'HTTP',
            is_shared_free: false,
            has_credentials: true,
            is_active: true,
            health_status: 'healthy',
            fail_count: 0,
            expires_at: '2030-07-18T00:00:00Z',
            created_at: '2026-07-16T00:00:00Z',
          },
          {
            id: 96,
            product: 'external_custom',
            label: 'Inventory Proxy Alpha',
            display_name: 'Inventory Proxy Alpha',
            host: 'tenant-proxy.local',
            port: 9000,
            protocol: 'HTTP',
            is_shared_free: false,
            has_credentials: true,
            is_active: true,
            health_status: 'degraded',
            fail_count: 1,
            created_at: '2026-07-18T00:00:00Z',
          },
          {
            id: 92,
            product: 'external_custom',
            label: 'Занятый прокси',
            display_name: 'Занятый прокси',
            host: 'occupied.local',
            port: 9002,
            protocol: 'HTTP',
            is_shared_free: false,
            has_credentials: true,
            is_active: true,
            health_status: 'healthy',
            fail_count: 0,
            assigned_account_id: 82,
            assigned_username: 'BetaSeller',
            created_at: '2026-07-18T00:00:00Z',
          },
          {
            id: 93,
            product: 'proxy_pro',
            label: 'Нерабочий прокси',
            display_name: 'Нерабочий прокси',
            host: 'unhealthy.local',
            port: 9003,
            protocol: 'HTTP',
            is_shared_free: false,
            has_credentials: true,
            is_active: true,
            health_status: 'unhealthy',
            fail_count: 3,
            created_at: '2026-07-18T00:00:00Z',
          },
          {
            id: 94,
            product: 'proxy_lite',
            label: 'Истёкший прокси',
            display_name: 'Истёкший прокси',
            host: 'expired.local',
            port: 9004,
            protocol: 'HTTP',
            is_shared_free: false,
            has_credentials: true,
            is_active: true,
            health_status: 'healthy',
            fail_count: 0,
            expires_at: '2020-07-18T00:00:00Z',
            created_at: '2020-06-18T00:00:00Z',
          },
          ...(freeTrialStatus !== 'available' ? [{
            id: 95,
            product: 'free_shared',
            label: 'Бесплатный прокси',
            display_name: 'Бесплатный прокси #1',
            host: 'free.local',
            port: 9005,
            protocol: 'HTTP',
            is_shared_free: true,
            has_credentials: false,
            is_active: true,
            health_status: 'healthy',
            fail_count: 0,
            expires_at: '2030-07-25T00:00:00Z',
            assigned_account_id: freeAccount?.id,
            assigned_username: freeAccount?.username,
            created_at: '2026-07-18T00:00:00Z',
          }] : []),
        ], free_trial: {
          status: freeTrialStatus,
          previously_used: previouslyUsedFree || freeTrialStatus !== 'available',
          ...(freeTrialStatus !== 'available' ? { proxy_id: 95, renew_available_at: '2030-07-25T20:00:00Z', expires_at: '2030-07-26T00:00:00Z' } : {}),
        } });
      }
      if (path === '/api/proxies/my/free/claim' && method === 'POST') {
        testScope.__FREE_CLAIM_CALLS__ = (testScope.__FREE_CLAIM_CALLS__ || 0) + 1;
        freeTrialStatus = 'active';
        return ok({
          action: 'claimed',
          free_trial: {
            status: 'active',
            previously_used: true,
            proxy_id: 95,
            renew_available_at: '2030-07-25T20:00:00Z',
            expires_at: '2030-07-26T00:00:00Z',
          },
        });
      }
      if (path === '/api/account-onboarding' && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}')) as { mode?: string; product?: string; proxy_id?: number; external_proxy?: { host?: string; port?: number } };
        testScope.__ONBOARDING_REQUESTS__?.push(body as Record<string, unknown>);
        if (body.mode === 'paid') {
          return ok({
            ...session('paid-session', 'paid', body.product === 'proxy_pro' ? 'Proxy Pro' : 'Proxy Lite', 'awaiting_payment', body.product),
            payment_id: 700,
            checkout_url: `http://localhost:3100/platform/accounts?accountOnboarding=paid-session&proxyPayment=success&paymentId=700`,
          }, 201);
        }
        if (body.mode === 'owned') return ok(session('owned-session', 'owned', body.proxy_id === 95 ? 'Бесплатный прокси #1' : 'Inventory Proxy Alpha'), 201);
        if (body.mode === 'external') return ok(session('external-session', 'external', `${body.external_proxy?.host}:${body.external_proxy?.port}`), 201);
        return ok(session('free-session', 'free', 'Бесплатный прокси'), 201);
      }
      if (path === '/api/account-onboarding/paid-session' && method === 'GET') {
        return ok(session('paid-session', 'paid', 'Proxy Lite', 'ready', 'proxy_lite'));
      }
      if (/^\/api\/account-onboarding\/[^/]+$/.test(path) && method === 'DELETE') {
        testScope.__ONBOARDING_CANCELS__ = (testScope.__ONBOARDING_CANCELS__ || 0) + 1;
        return ok({});
      }
      if (/^\/api\/account-onboarding\/[^/]+\/complete$/.test(path) && method === 'POST') {
        if (new Headers(init?.headers).get('Prefer') === 'respond-async') testScope.__ASYNC_PREFER_CALLS__! += 1;
        activeOperationKind = 'add';
        operationPolls = 0;
        if (holdCompleteRequest) {
          await new Promise<void>((resolve) => {
            testScope.__RELEASE_ONBOARDING_COMPLETE__ = resolve;
          });
        }
        testScope.__ONBOARDING_COMPLETE_RESOLVED__ = true;
        return ok({ operation: operation('add-operation', 'queued', 0) }, 202);
      }
      if (/^\/api\/accounts\/\d+\/runtime\/start$/.test(path) && method === 'POST') {
        if (new Headers(init?.headers).get('Prefer') === 'respond-async') testScope.__ASYNC_PREFER_CALLS__! += 1;
        activeOperationKind = 'runner';
        operationPolls = 0;
        return ok({ operation: operation('runner-operation', 'queued', 0) }, 202);
      }
      if (path === '/api/accounts/runtime/start-all' && method === 'POST') {
        if (new Headers(init?.headers).get('Prefer') === 'respond-async') testScope.__ASYNC_PREFER_CALLS__! += 1;
        activeOperationKind = 'batch';
        operationPolls = 0;
        return ok({ operation: operation('batch-operation', 'queued', 0) }, 202);
      }
      if (/^\/api\/operations\/[^/]+$/.test(path) && method === 'GET') {
        operationPolls += 1;
        const id = path.split('/').pop() || 'operation';
        if (id === 'add-operation') activeOperationKind = 'add';
        if (id === 'runner-operation') activeOperationKind = 'runner';
        if (id === 'batch-operation') activeOperationKind = 'batch';
        if (id === 'proxy-assignment-operation') activeOperationKind = 'proxy';
        if (activeOperationKind === 'add' && addError && failures[addError]) {
          const failure = failures[addError];
          return ok(operation(id, 'failed', 1, addError, failure.message));
        }
        if (activeOperationKind === 'add' && retryFlow) {
          if (operationPolls === 1) return ok(operation(id, 'running', 1));
          if (operationPolls === 2) return ok(operation(id, 'retry_wait', 1, 'funpay_validation_timeout', 'Повторяем попытку'));
          if (operationPolls === 3) return ok(operation(id, 'running', 2));
          if (operationPolls === 4) return ok(operation(id, 'retry_wait', 2, 'funpay_unavailable', 'Повторяем попытку'));
          if (operationPolls === 5) return ok(operation(id, 'running', 3));
        }
        if (activeOperationKind === 'proxy' && assignError) {
          return ok(operation(id, 'failed', 1, 'proxy_occupied', 'Прокси уже назначен другому вашему аккаунту'));
        }
        if (activeOperationKind === 'proxy' && assignWorkerError) {
          return ok(operation(id, 'failed', 3, 'proxy_assigned_runtime_failed', 'Прокси назначен, но воркеры не запустились', {
            account_id: 81,
            proxy_id: 91,
            assignment_applied: true,
            workers_started: false,
          }));
        }
        if (activeOperationKind === 'proxy' && assignRetryFlow) {
          if (operationPolls === 1) return ok(operation(id, 'running', 1));
          if (operationPolls === 2) return ok(operation(id, 'retry_wait', 1, 'funpay_validation_timeout', 'Повторяем попытку'));
          if (operationPolls === 3) return ok(operation(id, 'running', 2));
          if (operationPolls === 4) return ok(operation(id, 'retry_wait', 2, 'funpay_unavailable', 'Повторяем попытку'));
          if (operationPolls === 5) return ok(operation(id, 'running', 3));
        }
        if ((slowComplete || activeOperationKind !== 'add') && operationPolls < 2) {
          return ok(operation(id, 'running', 1));
        }
        if (activeOperationKind === 'add') {
          const addedAccount = {
            id: 83,
            funpay_user_id: 8301,
            username: 'CurrentTenantNew',
            runner_active: true,
            keeper_active: true,
            raiser_active: false,
            proxy_connected: true,
            proxy_label: 'Бесплатный прокси',
            proxy_type: 'free_shared',
          };
          accounts = preserveExisting ? [...accounts, addedAccount] : [addedAccount];
          return ok(operation(id, 'succeeded', retryFlow ? 3 : 1, '', '', { account_id: 83, username: 'CurrentTenantNew', proxy_id: 501 }));
        }
        if (activeOperationKind === 'proxy') {
          return ok(operation(id, 'succeeded', assignRetryFlow ? 3 : 1, '', '', {
            account_id: 81,
            proxy_id: 91,
            assignment_applied: true,
            workers_started: true,
          }));
        }
        accounts = accounts.map((account) => ({ ...account, runner_active: true, keeper_active: true, raiser_active: true }));
        return ok(operation(id, 'succeeded', 1, '', '', activeOperationKind === 'batch' ? { started: accounts.length, failed: {} } : { account_id: 81 }));
      }
      if (path === '/api/accounts/81/proxy/connect' && method === 'POST') {
        testScope.__PROXY_CONNECT_CALLS__ = (testScope.__PROXY_CONNECT_CALLS__ || 0) + 1;
        const body = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
        testScope.__PROXY_CONNECT_BODY__ = body;
        if (externalProxyError && body.mode === 'external') {
          return json({ success: false, error: 'Прокси не отвечает при подключении к FunPay.' }, 400);
        }
        if (body.mode === 'external') {
          accounts = accounts.map((account) => account.id === 81
            ? { ...account, proxy_connected: true, proxy_label: `${body.host}:${body.port}`, proxy_type: 'external' }
            : account);
        } else if (body.mode === 'free') {
          freeTrialStatus = 'active';
          accounts = accounts.map((account) => account.id === 81
            ? { ...account, proxy_connected: true, proxy_label: 'Бесплатный прокси #1', proxy_type: 'free_shared' }
            : account);
        }
        return ok({});
      }
      if (/^\/api\/proxies\/my\/(91|95|98)\/assign$/.test(path) && method === 'POST') {
        testScope.__OWNED_PROXY_ASSIGN_CALLS__ = (testScope.__OWNED_PROXY_ASSIGN_CALLS__ || 0) + 1;
        if (new Headers(init?.headers).get('Prefer') === 'respond-async') testScope.__ASYNC_PREFER_CALLS__! += 1;
        const body = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
        testScope.__OWNED_PROXY_ASSIGN_BODY__ = body;
        const assignedProxyID = Number(path.split('/')[4]);
        if (!assignError) {
          accounts = accounts.map((account) => {
            if (assignedProxyID === 95 && account.id !== 81 && account.proxy_type === 'free_shared') {
              return { ...account, proxy_connected: false, proxy_label: undefined, proxy_type: 'none' };
            }
            if (account.id !== 81) return account;
            return assignedProxyID === 95
              ? { ...account, proxy_connected: true, proxy_label: 'Бесплатный прокси #1', proxy_type: 'free_shared' }
              : { ...account, proxy_connected: true, proxy_label: assignedProxyID === 98 ? 'Proxy Pro' : 'Proxy Lite', proxy_type: 'individual' };
          });
        }
        activeOperationKind = 'proxy';
        operationPolls = 0;
        return ok({ operation: operation('proxy-assignment-operation', 'queued', 0) }, 202);
      }
      return ok(method === 'GET' ? [] : {});
    };
  });
});

for (const failure of ADD_FAILURES) {
  test(`onboarding complete ${failure.status} ${failure.code} keeps safe form state`, async ({ page }) => {
    await page.goto(`/platform/accounts?addError=${failure.code}`);
    await openAddAccount(page);
    await chooseFreeProxy(page);

    const input = page.getByTestId('golden-key-input');
    await expect(input).toHaveAttribute('type', 'password');
    await expect(input).toHaveAttribute('autocomplete', 'off');
    await input.fill(TEST_GOLDEN_KEY);
    await page.getByRole('button', { name: 'Добавить аккаунт', exact: true }).last().click();

    await expect(page.getByText(failure.message, { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Новый аккаунт' })).toBeVisible();
    await expect(input).toHaveValue(failure.clearsKey ? '' : TEST_GOLDEN_KEY);
  });
}

test('free onboarding succeeds and never calls legacy account add', async ({ page }) => {
  await page.goto('/platform/accounts?empty=1');
  await openAddAccount(page);
  await chooseFreeProxy(page);
  await page.getByTestId('golden-key-input').fill(TEST_GOLDEN_KEY);
  await page.getByRole('button', { name: 'Добавить аккаунт', exact: true }).last().click();

  await expect(page.getByRole('heading', { name: 'Новый аккаунт' })).toBeHidden();
  await expect(page.getByText('CurrentTenantNew', { exact: true })).toBeVisible();
  const legacyCalls = await page.evaluate(() => (window as typeof window & { __LEGACY_ACCOUNT_POSTS__?: number }).__LEGACY_ACCOUNT_POSTS__ || 0);
  expect(legacyCalls).toBe(0);
});

test('successful onboarding clears autofilled login and keeps every account visible', async ({ page }) => {
  await page.goto('/platform/accounts?preserveExisting=1');

  const searchInput = page.getByTestId('account-search-input');
  await expect(searchInput).toHaveAttribute('type', 'search');
  await expect(searchInput).toHaveAttribute('autocomplete', 'off');
  await expect(searchInput).toHaveAttribute('readonly', '');

  await openAddAccount(page);
  await chooseFreeProxy(page);
  await page.getByTestId('golden-key-input').fill(TEST_GOLDEN_KEY);

  // Reproduce a browser/password-manager autofill that writes the platform
  // login into the account search while the Golden Key password field is open.
  await searchInput.evaluate((element) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, 'qa@test.local');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(searchInput).toHaveValue('qa@test.local');

  await page.getByRole('button', { name: 'Добавить аккаунт', exact: true }).last().click();

  await expect(page.getByRole('heading', { name: 'Новый аккаунт' })).toBeHidden();
  await expect(searchInput).toHaveValue('');
  await expect(page.getByText('AlphaSeller', { exact: true })).toBeVisible();
  await expect(page.getByText('BetaSeller', { exact: true })).toBeVisible();
  await expect(page.getByText('CurrentTenantNew', { exact: true })).toBeVisible();
});

test('onboarding shows a blocking 45 second attempt while FunPay validates', async ({ page }) => {
  await page.goto('/platform/accounts?empty=1&slowComplete=1');
  await openAddAccount(page);
  await chooseFreeProxy(page);
  await page.getByTestId('golden-key-input').fill(TEST_GOLDEN_KEY);
  await page.getByRole('button', { name: 'Добавить аккаунт', exact: true }).last().click();

  const waitPanel = page.getByTestId('blocking-operation-overlay');
  await expect(waitPanel).toBeVisible();
  await expect(waitPanel).toContainText('Добавляем аккаунт');
  await expect(waitPanel).toContainText('Ожидание ответа FunPay');
  await expect(waitPanel).toContainText('Попытка 1 из 3');
  await expect(page.getByTestId('blocking-operation-progress')).toHaveAttribute('data-duration-ms', '45000');
  await expect(page.getByRole('button', { name: 'Ожидание…', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Новый аккаунт' })).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Новый аккаунт' })).toBeHidden();
});

test('onboarding overlay is visible above the modal with the active dark theme', async ({ page }) => {
  await page.goto('/platform/accounts?empty=1&holdCompleteRequest=1&dark=1');
  await openAddAccount(page);
  await chooseFreeProxy(page);
  await page.getByTestId('golden-key-input').fill(TEST_GOLDEN_KEY);
  const submitButton = page.getByRole('button', { name: 'Добавить аккаунт', exact: true }).last();
  const submitButtonBox = await submitButton.boundingBox();
  expect(submitButtonBox).not.toBeNull();
  await submitButton.click();

  const overlay = page.getByTestId('blocking-operation-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('Добавляем аккаунт');
  await expect(overlay).toContainText('Попытка 1 из 3');
  await expect(page.getByTestId('blocking-operation-progress')).toHaveAttribute('data-duration-ms', '45000');
  expect(await overlay.evaluate((element) => element.parentElement === document.body)).toBe(true);
  await expect(overlay).toHaveClass(/dark/);
  expect(await page.getByTestId('blocking-operation-panel').evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe('rgb(255, 255, 255)');
  expect(await page.evaluate(({ x, y }) => {
    const blockingOverlay = document.querySelector('[data-testid="blocking-operation-overlay"]');
    const topElement = document.elementFromPoint(x, y);
    return Boolean(blockingOverlay && topElement && blockingOverlay.contains(topElement));
  }, {
    x: submitButtonBox!.x + submitButtonBox!.width / 2,
    y: submitButtonBox!.y + submitButtonBox!.height / 2,
  })).toBe(true);
  expect(await page.evaluate(() => (
    window as typeof window & { __ONBOARDING_COMPLETE_RESOLVED__?: boolean }
  ).__ONBOARDING_COMPLETE_RESOLVED__)).toBe(false);

  await expect.poll(() => page.evaluate(() => typeof (
    window as typeof window & { __RELEASE_ONBOARDING_COMPLETE__?: () => void }
  ).__RELEASE_ONBOARDING_COMPLETE__)).toBe('function');
  await page.evaluate(() => {
    (window as typeof window & { __RELEASE_ONBOARDING_COMPLETE__?: () => void }).__RELEASE_ONBOARDING_COMPLETE__?.();
  });
  await expect(overlay).toBeHidden();
  await expect(page.getByText('CurrentTenantNew', { exact: true })).toBeVisible();
});

test('onboarding overlay follows attempts 1 to 3 and resets the progress attempt', async ({ page }) => {
  await page.goto('/platform/accounts?empty=1&retryFlow=1');
  await openAddAccount(page);
  await chooseFreeProxy(page);
  await page.getByTestId('golden-key-input').fill(TEST_GOLDEN_KEY);
  await page.getByRole('button', { name: 'Добавить аккаунт', exact: true }).last().click();

  const overlay = page.getByTestId('blocking-operation-overlay');
  await expect(overlay).toContainText('Попытка 1 из 3');
  await expect(overlay).toContainText('Попытка 2 из 3', { timeout: 5000 });
  await expect(page.getByTestId('blocking-operation-progress')).toHaveAttribute('data-attempt', '2');
  await expect(overlay).toContainText('Попытка 3 из 3', { timeout: 5000 });
  await expect(page.getByTestId('blocking-operation-progress')).toHaveAttribute('data-attempt', '3');
  await expect(overlay).toBeHidden();
  await expect(page.getByText('CurrentTenantNew', { exact: true })).toBeVisible();
});

test('start all Runner uses one async request and the blocking overlay', async ({ page }) => {
  await page.goto('/platform/accounts');
  await page.getByRole('button', { name: 'Запустить всё', exact: true }).click();

  const overlay = page.getByTestId('blocking-operation-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('Запускаем все Runner');
  await expect(overlay).toContainText('Попытка 1 из 3');
  await expect(overlay).toBeHidden();
  const preferCalls = await page.evaluate(() => (window as typeof window & { __ASYNC_PREFER_CALLS__?: number }).__ASYNC_PREFER_CALLS__ || 0);
  expect(preferCalls).toBe(1);
});

test('individual Runner start uses one async request and the blocking overlay', async ({ page }) => {
  await page.goto('/platform/accounts?stopped=1');
  const row = page.getByRole('row').filter({ hasText: 'BetaSeller' });
  await row.getByRole('button', { name: 'Открыть' }).click();
  await page.getByRole('button', { name: 'Запустить Runner' }).click();

  const overlay = page.getByTestId('blocking-operation-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('Запускаем Runner');
  await expect(overlay).toBeHidden();
  const preferCalls = await page.evaluate(() => (window as typeof window & { __ASYNC_PREFER_CALLS__?: number }).__ASYNC_PREFER_CALLS__ || 0);
  expect(preferCalls).toBe(1);
});

test('active operation overlay is restored after page reload without storing Golden Key', async ({ page }) => {
  await page.goto('/platform/accounts?empty=1&slowComplete=1');
  await openAddAccount(page);
  await chooseFreeProxy(page);
  await page.getByTestId('golden-key-input').fill(TEST_GOLDEN_KEY);
  await page.getByRole('button', { name: 'Добавить аккаунт', exact: true }).last().click();
  await expect(page.getByTestId('blocking-operation-overlay')).toBeVisible();

  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem('fpcloud:accounts:active-operation')))
    .toContain('add-operation');
  const storedBeforeReload = await page.evaluate(() => window.sessionStorage.getItem('fpcloud:accounts:active-operation'));
  expect(storedBeforeReload).toContain('add-operation');
  expect(storedBeforeReload).not.toContain(TEST_GOLDEN_KEY);
  await page.reload();

  await expect(page.getByTestId('blocking-operation-overlay')).toBeVisible();
  await expect(page.getByTestId('blocking-operation-overlay')).toContainText('Добавляем аккаунт');
  await expect(page.getByTestId('blocking-operation-overlay')).toBeHidden();
  await expect(page.getByText('CurrentTenantNew', { exact: true })).toBeVisible();
});

test('free proxy claim adds it to inventory without assigning the account and shows 48/52 notice', async ({ page }) => {
  await page.goto('/platform/accounts');
  const alphaRow = page.getByRole('row').filter({ hasText: 'AlphaSeller' });
  await alphaRow.getByRole('button', { name: 'Сменить прокси' }).click();

  const freeCard = page.getByTestId('change-proxy-option-free');
  await expect(freeCard).toContainText('Бесплатный прокси');
  await expect(freeCard).not.toContainText('Выбрать прокси со склада');
  await freeCard.getByRole('button', { name: 'Получить', exact: true }).click();
  const notice = page.getByTestId('free-proxy-claimed-notice');
  await expect(notice).toContainText('Бесплатный прокси получен');
  await expect(notice).toContainText('52 часа');
  await expect(notice).toContainText('Через 48 часов');
  await expect(alphaRow).not.toContainText('Бесплатный прокси #1');

  const request = await page.evaluate(() => {
    const scope = window as typeof window & {
      __PROXY_CONNECT_CALLS__?: number;
      __FREE_CLAIM_CALLS__?: number;
      __INVENTORY_CALLS__?: number;
    };
    return {
      connectCalls: scope.__PROXY_CONNECT_CALLS__ || 0,
      claimCalls: scope.__FREE_CLAIM_CALLS__ || 0,
      inventoryCalls: scope.__INVENTORY_CALLS__ || 0,
    };
  });
  expect(request).toEqual({ connectCalls: 0, claimCalls: 1, inventoryCalls: 1 });
  await notice.getByRole('button', { name: 'Выбрать со склада' }).click();
  await expect(page.getByTestId('change-proxy-owned-list').getByText('Бесплатный прокси #1', { exact: true })).toBeVisible();
});

test('onboarding claims Free first and then selects it as owned inventory', async ({ page }) => {
  await page.goto('/platform/accounts');
  await openAddAccount(page);
  await page.getByTestId('onboarding-proxy-option-free').click();
  await expect(page.getByTestId('free-proxy-claimed-notice')).toBeVisible();
  await page.getByRole('button', { name: 'Выбрать со склада' }).click();
  await page.getByTestId('owned-proxy-list').getByRole('button').filter({ hasText: 'Бесплатный прокси #1' }).click();
  await expect(page.getByTestId('selected-onboarding-proxy')).toContainText('Бесплатный прокси #1');
  const requests = await page.evaluate(() => ({
    claims: (window as typeof window & { __FREE_CLAIM_CALLS__?: number }).__FREE_CLAIM_CALLS__ || 0,
    onboarding: (window as typeof window & { __ONBOARDING_REQUESTS__?: Record<string, unknown>[] }).__ONBOARDING_REQUESTS__ || [],
  }));
  expect(requests).toEqual({ claims: 1, onboarding: [{ mode: 'owned', proxy_id: 95 }] });
});

test('free card opens warehouse when another account already uses the shared proxy', async ({ page }) => {
  await page.goto('/platform/accounts?freeOn=beta');
  const alphaRow = page.getByRole('row').filter({ hasText: 'AlphaSeller' });
  await alphaRow.getByRole('button', { name: 'Сменить прокси' }).click();

  const warehouseCard = page.getByTestId('change-proxy-option-free');
  await expect(warehouseCard).toContainText('Выбрать прокси со склада');
  await expect(warehouseCard).toContainText('Выберите свободный прокси из «Моих прокси».');
  await warehouseCard.getByRole('button', { name: 'Выбрать', exact: true }).click();

  const inventory = page.getByTestId('change-proxy-owned-list');
  await expect(inventory).toBeVisible();
  await expect(inventory.getByText('Купленный Proxy Lite', { exact: true })).toBeVisible();
  const calls = await page.evaluate(() => {
    const scope = window as typeof window & { __PROXY_CONNECT_CALLS__?: number; __INVENTORY_CALLS__?: number };
    return { connect: scope.__PROXY_CONNECT_CALLS__ || 0, inventory: scope.__INVENTORY_CALLS__ || 0 };
  });
  expect(calls).toEqual({ connect: 0, inventory: 2 });
});

test('onboarding free card opens warehouse and selects an owned proxy without requesting free mode', async ({ page }) => {
  await page.goto('/platform/accounts?freeOn=beta');
  await openAddAccount(page);

  const warehouseCard = page.getByTestId('onboarding-proxy-option-free');
  await expect(warehouseCard).toContainText('Выбрать прокси со склада');
  await warehouseCard.click();
  const inventory = page.getByTestId('owned-proxy-list');
  await expect(inventory).toBeVisible();
  await inventory.getByRole('button').filter({ hasText: 'Купленный Proxy Lite' }).click();
  await expect(page.getByTestId('golden-key-input')).toBeVisible();

  const requests = await page.evaluate(() => {
    const scope = window as typeof window & {
      __ONBOARDING_REQUESTS__?: Record<string, unknown>[];
      __INVENTORY_CALLS__?: number;
    };
    return { onboarding: scope.__ONBOARDING_REQUESTS__ || [], inventory: scope.__INVENTORY_CALLS__ || 0 };
  });
  expect(requests.inventory).toBe(2);
  expect(requests.onboarding).toEqual([{ mode: 'owned', proxy_id: 91 }]);
  expect(requests.onboarding).not.toContainEqual({ mode: 'free' });
});

test('free trial stays in warehouse after the current shared proxy is replaced', async ({ page }) => {
  await page.goto('/platform/accounts?freeOn=alpha');
  const alphaRow = page.getByRole('row').filter({ hasText: 'AlphaSeller' });
  await alphaRow.getByRole('button', { name: 'Сменить прокси' }).click();

  const warehouseCard = page.getByTestId('change-proxy-option-free');
  await expect(warehouseCard).toContainText('Выбрать прокси со склада');
  await warehouseCard.getByRole('button', { name: 'Выбрать', exact: true }).click();
  await page.getByTestId('change-proxy-owned-list').getByRole('button').filter({ hasText: 'Купленный Proxy Lite' }).click();
  await expect(alphaRow).toContainText('Proxy Lite');

  await alphaRow.getByRole('button', { name: 'Сменить прокси' }).click();
  const warehouseCardAfterReplacement = page.getByTestId('change-proxy-option-free');
  await expect(warehouseCardAfterReplacement).toContainText('Выбрать прокси со склада');
  await expect(warehouseCardAfterReplacement).not.toContainText('Бесплатный прокси');
  await warehouseCardAfterReplacement.getByRole('button', { name: 'Выбрать', exact: true }).click();
  const inventory = page.getByTestId('change-proxy-owned-list');
  await expect(inventory.getByText('Бесплатный прокси #1', { exact: true })).toBeVisible();
  await expect(inventory.getByText(/до 25\.07/)).toBeVisible();
});

test('expired free lease restores the option to claim a new proxy', async ({ page }) => {
  await page.goto('/platform/accounts?freeTrial=expired');
  const alphaRow = page.getByRole('row').filter({ hasText: 'AlphaSeller' });
  await alphaRow.getByRole('button', { name: 'Сменить прокси' }).click();
  const freeCard = page.getByTestId('change-proxy-option-free');
  await expect(freeCard).toContainText('Бесплатный прокси');
  await expect(freeCard.getByRole('button', { name: 'Получить', exact: true })).toBeVisible();
});

test('active free trial can be moved between own accounts with one assignment request', async ({ page }) => {
  await page.goto('/platform/accounts?freeOn=beta');
  const alphaRow = page.getByRole('row').filter({ hasText: 'AlphaSeller' });
  await alphaRow.getByRole('button', { name: 'Сменить прокси' }).click();
  await page.getByTestId('change-proxy-option-free').getByRole('button', { name: 'Выбрать', exact: true }).click();
  const freeItem = page.getByTestId('change-proxy-owned-list').getByRole('button').filter({ hasText: 'Бесплатный прокси #1' });
  await expect(freeItem).toContainText('BetaSeller');
  await expect(freeItem).toContainText('Перенести');
  await freeItem.evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(alphaRow).toContainText('Бесплатный прокси #1');
  const assignment = await page.evaluate(() => ({
    calls: (window as typeof window & { __OWNED_PROXY_ASSIGN_CALLS__?: number }).__OWNED_PROXY_ASSIGN_CALLS__ || 0,
    body: (window as typeof window & { __OWNED_PROXY_ASSIGN_BODY__?: Record<string, unknown> }).__OWNED_PROXY_ASSIGN_BODY__,
  }));
  expect(assignment).toEqual({ calls: 1, body: { account_id: 81 } });
});

test('warehouse replacement card fits a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/platform/accounts?freeOn=beta');
  const alphaRow = page.getByRole('row').filter({ hasText: 'AlphaSeller' });
  await alphaRow.getByRole('button', { name: 'Сменить прокси' }).click();

  await expect(page.getByTestId('change-proxy-option-free')).toContainText('Выбрать прокси со склада');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('paid onboarding restores after checkout and shows server proxy label', async ({ page }) => {
  await page.goto('/platform/accounts');
  await openAddAccount(page);
  await page.getByRole('button', { name: /Proxy Lite/ }).click();

  await expect(page).toHaveURL('http://localhost:3100/platform/accounts');
  await expect(page.getByTestId('golden-key-input')).toBeVisible();
  await expect(page.getByTestId('selected-onboarding-proxy')).toContainText('Proxy Lite');
});

test('owned inventory proxy is selected by current tenant response', async ({ page }) => {
  await page.goto('/platform/accounts');
  await openAddAccount(page);
  await page.getByRole('button', { name: /Свой прокси/ }).click();
  const inventory = page.getByTestId('owned-proxy-list');
  await expect(inventory.getByText('Текущий Proxy Lite', { exact: true })).toBeVisible();
  await expect(inventory.getByText('Свободный Proxy Pro', { exact: true })).toBeVisible();
  await expect(inventory.getByRole('button').filter({ hasText: 'Текущий Proxy Lite' })).toBeDisabled();
  await expect(inventory.getByRole('button').filter({ hasText: 'Занятый прокси' })).toBeDisabled();
  await expect(inventory.getByRole('button').filter({ hasText: 'Нерабочий прокси' })).toBeDisabled();
  await page.getByRole('button', { name: /Inventory Proxy Alpha/ }).click();

  await expect(page.getByTestId('golden-key-input')).toBeVisible();
  await expect(page.getByTestId('selected-onboarding-proxy')).toContainText('Inventory Proxy Alpha');
});

test('new external proxy is validated before Golden Key step', async ({ page }) => {
  await page.goto('/platform/accounts');
  await openAddAccount(page);
  await page.getByRole('button', { name: /Свой прокси/ }).click();
  await page.getByRole('button', { name: 'Добавить новый' }).click();
  await page.getByLabel('Хост прокси').fill('proxy.example');
  await page.getByLabel('Порт прокси').fill('8080');
  await page.getByRole('button', { name: 'Проверить и выбрать' }).click();

  await expect(page.getByTestId('golden-key-input')).toBeVisible();
  await expect(page.getByTestId('selected-onboarding-proxy')).toContainText('proxy.example:8080');
});

test('existing-account own proxy flow offers both actions and resets credentials after close', async ({ page }) => {
  await page.goto('/platform/accounts');
  await openOwnProxyActions(page);

  await expect(page.getByRole('button', { name: /Выбрать из существующих/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Добавить свой новый/ }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Назад' }).click();
  await expect(page.getByTestId('change-proxy-catalog')).toBeVisible();
  await page.getByRole('button', { name: 'Выбрать', exact: true }).click();
  await page.getByRole('button', { name: /Добавить свой новый/ }).click();

  await page.getByLabel('Хост нового прокси').fill('private-proxy.example');
  await page.getByLabel('Логин нового прокси').fill('private-user');
  await page.getByLabel('Пароль нового прокси').fill('private-secret');
  await page.getByRole('button', { name: 'Отмена' }).click();

  await openOwnProxyActions(page);
  await page.getByRole('button', { name: /Добавить свой новый/ }).click();
  await expect(page.getByLabel('Хост нового прокси')).toHaveValue('');
  await expect(page.getByLabel('Порт нового прокси')).toHaveValue('8080');
  await expect(page.getByLabel('Логин нового прокси')).toHaveValue('');
  await expect(page.getByLabel('Пароль нового прокси')).toHaveValue('');
});

test('existing-account selects an available purchased proxy and filters unavailable inventory', async ({ page }) => {
  await page.goto('/platform/accounts');
  await openOwnProxyActions(page);
  await page.getByRole('button', { name: /Выбрать из существующих/ }).click();

  const inventory = page.getByTestId('change-proxy-owned-list');
  await expect(inventory.getByText('Текущий Proxy Lite', { exact: true })).toBeVisible();
  await expect(inventory.getByText('Купленный Proxy Lite', { exact: true })).toBeVisible();
  await expect(inventory.getByText('Свободный Proxy Pro', { exact: true })).toBeVisible();
  await expect(inventory.getByText('Inventory Proxy Alpha', { exact: true })).toBeVisible();
  await expect(inventory.getByText('Занятый прокси', { exact: true })).toBeVisible();
  await expect(inventory.getByText('Нерабочий прокси', { exact: true })).toBeVisible();
  await expect(inventory.getByText('Истёкший прокси', { exact: true })).toHaveCount(0);
  await expect(inventory.getByText('Бесплатный прокси #1', { exact: true })).toHaveCount(0);
  await expect(inventory.getByRole('button').filter({ hasText: 'Текущий Proxy Lite' })).toBeDisabled();
  await expect(inventory.getByRole('button').filter({ hasText: 'Занятый прокси' })).toBeDisabled();
  await expect(inventory.getByRole('button').filter({ hasText: 'Нерабочий прокси' })).toBeDisabled();

  await inventory.getByRole('button').filter({ hasText: 'Купленный Proxy Lite' }).evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page.getByTestId('change-proxy-owned-list')).toBeHidden();
  const alphaRow = page.getByRole('row').filter({ hasText: 'AlphaSeller' });
  await expect(alphaRow).toContainText('Proxy Lite');

  const assignment = await page.evaluate(() => {
    const scope = window as typeof window & {
      __OWNED_PROXY_ASSIGN_CALLS__?: number;
      __OWNED_PROXY_ASSIGN_BODY__?: Record<string, unknown>;
    };
    return { calls: scope.__OWNED_PROXY_ASSIGN_CALLS__ || 0, body: scope.__OWNED_PROXY_ASSIGN_BODY__ };
  });
  expect(assignment.calls).toBe(1);
  expect(assignment.body).toEqual({ account_id: 81 });
});

test('existing-account proxy assignment shows three real 45 second attempts', async ({ page }) => {
  await page.goto('/platform/accounts?assignRetryFlow=1');
  await openOwnProxyActions(page);
  await page.getByRole('button', { name: /Выбрать из существующих/ }).click();
  await page.getByRole('button').filter({ hasText: 'Купленный Proxy Lite' }).click();

  const overlay = page.getByTestId('blocking-operation-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('Назначаем и проверяем прокси');
  await expect(overlay).toContainText('Попытка 1 из 3');
  await expect(page.getByTestId('blocking-operation-progress')).toHaveAttribute('data-duration-ms', '45000');
  await expect(overlay).toContainText('Попытка 2 из 3', { timeout: 5000 });
  await expect(overlay).toContainText('Попытка 3 из 3', { timeout: 5000 });
  await expect(overlay).toBeHidden();

  const calls = await page.evaluate(() => (window as typeof window & { __OWNED_PROXY_ASSIGN_CALLS__?: number }).__OWNED_PROXY_ASSIGN_CALLS__ || 0);
  expect(calls).toBe(1);
});

test('existing-account inventory distinguishes empty and retryable error states', async ({ page }) => {
  await page.goto('/platform/accounts?inventoryErrorOnce=1');
  await openOwnProxyActions(page);
  await page.getByRole('button', { name: /Выбрать из существующих/ }).click();
  await expect(page.getByText('Не удалось загрузить инвентарь', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByText('Купленный Proxy Lite', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Отмена' }).click();
  await page.goto('/platform/accounts?emptyInventory=1');
  await openOwnProxyActions(page);
  await page.getByRole('button', { name: /Выбрать из существующих/ }).click();
  await expect(page.getByText('Доступных прокси нет.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('change-proxy-owned-list').getByRole('button', { name: 'Добавить свой новый', exact: true }).last()).toBeVisible();
});

test('existing-account assignment error keeps inventory open and reloads availability', async ({ page }) => {
  await page.goto('/platform/accounts?assignError=1');
  await openOwnProxyActions(page);
  await page.getByRole('button', { name: /Выбрать из существующих/ }).click();
  await page.getByRole('button').filter({ hasText: 'Купленный Proxy Lite' }).click();

  await expect(page.getByText('Прокси уже назначен другому вашему аккаунту', { exact: true })).toBeVisible();
  await expect(page.getByTestId('change-proxy-owned-list')).toBeVisible();
  await expect(page.getByText('Купленный Proxy Lite', { exact: true })).toBeVisible();
});

test('existing-account external proxy error keeps entered form open', async ({ page }) => {
  await page.goto('/platform/accounts?externalProxyError=1');
  await openOwnProxyActions(page);
  await page.getByRole('button', { name: /Добавить свой новый/ }).click();
  await page.getByLabel('Хост нового прокси').fill('offline-proxy.example');
  await page.getByLabel('Порт нового прокси').fill('8181');
  await page.getByRole('button', { name: 'Подтвердить' }).click();

  await expect(page.getByText('Прокси не отвечает при подключении к FunPay.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('change-proxy-external-form')).toBeVisible();
  await expect(page.getByLabel('Хост нового прокси')).toHaveValue('offline-proxy.example');
});

test('existing-account connects a new external proxy with normalized credentials', async ({ page }) => {
  await page.goto('/platform/accounts');
  await openOwnProxyActions(page);
  await page.getByRole('button', { name: /Добавить свой новый/ }).click();
  await page.getByLabel('Протокол нового прокси').selectOption('SOCKS5');
  await page.getByLabel('Хост нового прокси').fill('  new-proxy.example  ');
  await page.getByLabel('Порт нового прокси').fill('1080');
  await page.getByLabel('Логин нового прокси').fill('  proxy-user  ');
  await page.getByLabel('Пароль нового прокси').fill('proxy-secret');
  await page.getByRole('button', { name: 'Подтвердить' }).click();

  await expect(page.getByTestId('change-proxy-external-form')).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: 'AlphaSeller' })).toContainText('new-proxy.example:1080');
  const request = await page.evaluate(() => {
    const scope = window as typeof window & {
      __PROXY_CONNECT_CALLS__?: number;
      __PROXY_CONNECT_BODY__?: Record<string, unknown>;
    };
    return { calls: scope.__PROXY_CONNECT_CALLS__ || 0, body: scope.__PROXY_CONNECT_BODY__ };
  });
  expect(request.calls).toBe(1);
  expect(request.body).toEqual({
    mode: 'external',
    protocol: 'SOCKS5',
    host: 'new-proxy.example',
    port: 1080,
    username: 'proxy-user',
    password: 'proxy-secret',
  });
});

test('existing-account own proxy steps fit a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/platform/accounts');
  await openOwnProxyActions(page);
  await expect(page.getByRole('button', { name: /Выбрать из существующих/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Добавить свой новый/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole('button', { name: /Выбрать из существующих/ }).click();
  await expect(page.getByText('Купленный Proxy Lite', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('existing-account owned proxy target remains tenant scoped', async ({ page }) => {
  await page.goto('/platform/accounts?dropTarget=1');
  await openOwnProxyActions(page);
  await page.getByRole('button', { name: /Выбрать из существующих/ }).click();
  await expect(page.getByText('Купленный Proxy Lite', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    (window as typeof window & { __DROP_PROXY_TARGET_NOW__?: boolean }).__DROP_PROXY_TARGET_NOW__ = true;
  });
  await page.getByRole('button').filter({ hasText: 'Купленный Proxy Lite' }).click();

  await expect(page.getByText('Аккаунт больше недоступен. Обновите список и выберите его снова.', { exact: true })).toBeVisible();
  const assignmentCalls = await page.evaluate(() => (window as typeof window & { __OWNED_PROXY_ASSIGN_CALLS__?: number }).__OWNED_PROXY_ASSIGN_CALLS__ || 0);
  expect(assignmentCalls).toBe(0);
});

test('existing-account reflects partial success when assigned proxy workers fail', async ({ page }) => {
  await page.goto('/platform/accounts?assignWorkerError=1');
  await openOwnProxyActions(page);
  await page.getByRole('button', { name: /Выбрать из существующих/ }).click();
  await page.getByRole('button').filter({ hasText: 'Купленный Proxy Lite' }).click();

  await expect(page.getByText('Прокси назначен, но воркеры не запустились', { exact: true })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'AlphaSeller' })).toContainText('Proxy Lite');
  await expect(page.getByTestId('change-proxy-owned-list')).toBeHidden();
});

test('cancelling wizard discards session before another user target can leak', async ({ page }) => {
  await page.goto('/platform/accounts');
  await openAddAccount(page);
  await chooseFreeProxy(page);
  await page.getByRole('button', { name: 'Отмена', exact: true }).click();
  await openAddAccount(page);

  await expect(page.getByTestId('onboarding-proxy-picker')).toBeVisible();
  await expect(page.getByTestId('onboarding-proxy-option-free')).toContainText('Выбрать прокси со склада');
  const cancels = await page.evaluate(() => (window as typeof window & { __ONBOARDING_CANCELS__?: number }).__ONBOARDING_CANCELS__ || 0);
  expect(cancels).toBe(1);
});

test('free claim remains inventory-only if the account disappears', async ({ page }) => {
  await page.goto('/platform/accounts?dropTarget=1');
  const alphaRow = page.getByRole('row').filter({ hasText: 'AlphaSeller' });
  await alphaRow.getByRole('button', { name: 'Сменить прокси' }).click();
  await expect(page.getByText('Аккаунт: AlphaSeller', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    (window as typeof window & { __DROP_PROXY_TARGET_NOW__?: boolean }).__DROP_PROXY_TARGET_NOW__ = true;
  });
  await page.getByTestId('change-proxy-option-free').getByRole('button', { name: 'Получить' }).click();

  await expect(page.getByTestId('free-proxy-claimed-notice')).toBeVisible();
  const request = await page.evaluate(() => {
    const scope = window as typeof window & {
      __FREE_CLAIM_CALLS__?: number;
      __PROXY_CONNECT_CALLS__?: number;
    };
    return {
      claimCalls: scope.__FREE_CLAIM_CALLS__ || 0,
      connectCalls: scope.__PROXY_CONNECT_CALLS__ || 0,
    };
  });
  expect(request).toEqual({ claimCalls: 1, connectCalls: 0 });
});
