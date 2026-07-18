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
  await expect(page.getByTestId('golden-key-input')).toBeVisible();
  await expect(page.getByTestId('selected-onboarding-proxy')).toContainText('Бесплатный прокси');
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
    const addError = params.get('addError');
    const slowComplete = params.get('slowComplete') === '1';
    const holdCompleteRequest = params.get('holdCompleteRequest') === '1';
    const retryFlow = params.get('retryFlow') === '1';
    const startEmpty = params.get('empty') === '1';
    const startStopped = params.get('stopped') === '1';
    const dropTarget = params.get('dropTarget') === '1';
    let accounts = startEmpty ? [] : [
      {
        id: 81,
        funpay_user_id: 8101,
        username: 'AlphaSeller',
        runner_active: true,
        keeper_active: true,
        raiser_active: false,
        proxy_connected: false,
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
      },
    ];
    if (startStopped) {
      accounts = accounts.map((account) => ({ ...account, runner_active: false, keeper_active: false, raiser_active: false }));
    }
    let operationPolls = 0;
    let activeOperationKind: 'add' | 'runner' | 'batch' | null = null;
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
      __DROP_PROXY_TARGET_NOW__?: boolean;
      __LEGACY_ACCOUNT_POSTS__?: number;
      __ONBOARDING_CANCELS__?: number;
      __ASYNC_PREFER_CALLS__?: number;
      __ONBOARDING_COMPLETE_RESOLVED__?: boolean;
      __RELEASE_ONBOARDING_COMPLETE__?: () => void;
    };
    testScope.__PROXY_CONNECT_CALLS__ = 0;
    testScope.__DROP_PROXY_TARGET_NOW__ = false;
    testScope.__LEGACY_ACCOUNT_POSTS__ = 0;
    testScope.__ONBOARDING_CANCELS__ = 0;
    testScope.__ASYNC_PREFER_CALLS__ = 0;
    testScope.__ONBOARDING_COMPLETE_RESOLVED__ = false;

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
        kind: activeOperationKind === 'add' ? 'account_onboarding_complete' : activeOperationKind === 'batch' ? 'runtime_start_batch' : 'runtime_start',
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
        return ok({ items: [{
          id: 91,
          product: 'external_custom',
          label: 'Inventory Proxy Alpha',
          display_name: 'Inventory Proxy Alpha',
          host: 'tenant-proxy.local',
          port: 9000,
          protocol: 'HTTP',
          is_shared_free: false,
          has_credentials: true,
          is_active: true,
          health_status: 'healthy',
          fail_count: 0,
          created_at: '2026-07-18T00:00:00Z',
        }] });
      }
      if (path === '/api/account-onboarding' && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}')) as { mode?: string; product?: string; proxy_id?: number; external_proxy?: { host?: string; port?: number } };
        if (body.mode === 'paid') {
          return ok({
            ...session('paid-session', 'paid', body.product === 'proxy_pro' ? 'Proxy Pro' : 'Proxy Lite', 'awaiting_payment', body.product),
            payment_id: 700,
            checkout_url: `http://localhost:3100/platform/accounts?accountOnboarding=paid-session&proxyPayment=success&paymentId=700`,
          }, 201);
        }
        if (body.mode === 'owned') return ok(session('owned-session', 'owned', 'Inventory Proxy Alpha'), 201);
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
        if ((slowComplete || activeOperationKind !== 'add') && operationPolls < 2) {
          return ok(operation(id, 'running', 1));
        }
        if (activeOperationKind === 'add') {
          accounts = [{
            id: 83,
            funpay_user_id: 8301,
            username: 'CurrentTenantNew',
            runner_active: true,
            keeper_active: true,
            raiser_active: false,
            proxy_connected: true,
            proxy_label: 'Бесплатный прокси',
          }];
          return ok(operation(id, 'succeeded', retryFlow ? 3 : 1, '', '', { account_id: 83, username: 'CurrentTenantNew', proxy_id: 501 }));
        }
        accounts = accounts.map((account) => ({ ...account, runner_active: true, keeper_active: true, raiser_active: true }));
        return ok(operation(id, 'succeeded', 1, '', '', activeOperationKind === 'batch' ? { started: accounts.length, failed: {} } : { account_id: 81 }));
      }
      if (path === '/api/accounts/81/proxy/connect' && method === 'POST') {
        testScope.__PROXY_CONNECT_CALLS__ = (testScope.__PROXY_CONNECT_CALLS__ || 0) + 1;
        return ok({});
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

test('onboarding overlay is visible before the complete request returns', async ({ page }) => {
  await page.goto('/platform/accounts?empty=1&holdCompleteRequest=1');
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

test('cancelling wizard discards session before another user target can leak', async ({ page }) => {
  await page.goto('/platform/accounts');
  await openAddAccount(page);
  await chooseFreeProxy(page);
  await page.getByRole('button', { name: 'Отмена', exact: true }).click();
  await openAddAccount(page);

  await expect(page.getByTestId('onboarding-proxy-picker')).toBeVisible();
  await expect(page.getByText('Бесплатный прокси', { exact: true })).toHaveCount(1);
  const cancels = await page.evaluate(() => (window as typeof window & { __ONBOARDING_CANCELS__?: number }).__ONBOARDING_CANCELS__ || 0);
  expect(cancels).toBe(1);
});

test('existing-account proxy target remains tenant scoped', async ({ page }) => {
  await page.goto('/platform/accounts?dropTarget=1');
  const alphaRow = page.getByRole('row').filter({ hasText: 'AlphaSeller' });
  await alphaRow.getByRole('button', { name: 'Сменить прокси' }).click();
  await expect(page.getByText('Аккаунт: AlphaSeller', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    (window as typeof window & { __DROP_PROXY_TARGET_NOW__?: boolean }).__DROP_PROXY_TARGET_NOW__ = true;
  });
  await page.getByRole('button', { name: 'Подключить' }).click();

  await expect(page.getByText('Аккаунт больше недоступен. Обновите список и выберите его снова.', { exact: true })).toBeVisible();
  const proxyCalls = await page.evaluate(() => (window as typeof window & { __PROXY_CONNECT_CALLS__?: number }).__PROXY_CONNECT_CALLS__ || 0);
  expect(proxyCalls).toBe(0);
});
