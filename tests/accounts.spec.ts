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
];

async function openAddAccount(page: Page) {
  await page.getByRole('button', { name: 'Добавить аккаунт', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Новый аккаунт' })).toBeVisible();
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
    const startEmpty = params.get('empty') === '1';
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
    const failures: Record<string, { status: number; message: string }> = {
      invalid_golden_key: {
        status: 422,
        message: 'Golden Key недействителен или сессия FunPay истекла. Получите новый ключ и попробуйте снова.',
      },
      funpay_account_already_linked: {
        status: 409,
        message: 'Этот Golden Key относится к FunPay-аккаунту, уже привязанному к другому профилю FunPay Cloud. Войдите в нужный аккаунт FunPay и получите его новый Golden Key.',
      },
      funpay_unavailable: {
        status: 503,
        message: 'FunPay временно недоступен. Повторите попытку через несколько секунд.',
      },
      funpay_validation_timeout: {
        status: 504,
        message: 'FunPay не ответил вовремя. Повторите попытку через несколько секунд.',
      },
    };
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
    const ok = (data: unknown) => json({ success: true, data });
    const originalFetch = window.fetch.bind(window);
    const testScope = window as typeof window & { __PROXY_CONNECT_CALLS__?: number; __DROP_PROXY_TARGET_NOW__?: boolean };
    testScope.__PROXY_CONNECT_CALLS__ = 0;
    testScope.__DROP_PROXY_TARGET_NOW__ = false;

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
        if (addError && failures[addError]) {
          const failure = failures[addError];
          return json({ success: false, code: addError, error: failure.message }, failure.status);
        }
        accounts = [{
          id: 83,
          funpay_user_id: 8301,
          username: 'CurrentTenantNew',
          runner_active: false,
          keeper_active: false,
          raiser_active: false,
          proxy_connected: false,
        }];
        return ok({ id: 83 });
      }
      if (path === '/api/accounts/81/proxy' && method === 'POST') {
        const scope = window as typeof window & { __PROXY_CONNECT_CALLS__?: number };
        scope.__PROXY_CONNECT_CALLS__ = (scope.__PROXY_CONNECT_CALLS__ || 0) + 1;
        return ok({});
      }
      return ok(method === 'GET' ? [] : {});
    };
  });
});

for (const failure of ADD_FAILURES) {
  test(`add account ${failure.status} ${failure.code} keeps safe form state`, async ({ page }) => {
    await page.goto(`/platform/accounts?addError=${failure.code}`);
    await openAddAccount(page);

    const input = page.getByTestId('golden-key-input');
    await expect(input).toHaveAttribute('type', 'password');
    await expect(input).toHaveAttribute('autocomplete', 'off');
    await input.fill(TEST_GOLDEN_KEY);
    await page.getByRole('button', { name: 'Добавить', exact: true }).click();

    await expect(page.getByText(failure.message, { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Новый аккаунт' })).toBeVisible();
    await expect(input).toHaveValue(failure.clearsKey ? '' : TEST_GOLDEN_KEY);
  });
}

test('successful add refreshes the current tenant account list', async ({ page }) => {
  await page.goto('/platform/accounts?empty=1');
  await openAddAccount(page);
  await page.getByTestId('golden-key-input').fill(TEST_GOLDEN_KEY);
  await page.getByRole('button', { name: 'Добавить', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Новый аккаунт' })).toBeHidden();
  await expect(page.getByText('CurrentTenantNew', { exact: true })).toBeVisible();
  await expect(page.getByText('AlphaSeller', { exact: true })).toHaveCount(0);
});

test('proxy target follows the selected tenant account and resets after closing', async ({ page }) => {
  await page.goto('/platform/accounts');
  const alphaRow = page.getByRole('row').filter({ hasText: 'AlphaSeller' });
  await alphaRow.getByRole('button', { name: 'Сменить прокси' }).click();
  await expect(page.getByText('Аккаунт: AlphaSeller', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Настроить' }).click();
  await expect(page.getByText('Аккаунт: AlphaSeller', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Отмена' }).click();

  const betaRow = page.getByRole('row').filter({ hasText: 'BetaSeller' });
  await betaRow.getByRole('button', { name: 'Сменить прокси' }).click();
  await expect(page.getByText('Аккаунт: BetaSeller', { exact: true })).toBeVisible();
  await expect(page.getByText('Аккаунт: AlphaSeller', { exact: true })).toHaveCount(0);
});

test('proxy action is blocked when the account disappears from the fresh tenant list', async ({ page }) => {
  await page.goto('/platform/accounts?dropTarget=1');
  const alphaRow = page.getByRole('row').filter({ hasText: 'AlphaSeller' });
  await alphaRow.getByRole('button', { name: 'Сменить прокси' }).click();
  await page.evaluate(() => {
    (window as typeof window & { __DROP_PROXY_TARGET_NOW__?: boolean }).__DROP_PROXY_TARGET_NOW__ = true;
  });
  await page.getByRole('button', { name: 'Подключить' }).click();

  await expect(page.getByText('Аккаунт больше недоступен. Обновите список и выберите его снова.', { exact: true })).toBeVisible();
  await expect(page.getByText('Аккаунт: AlphaSeller', { exact: true })).toHaveCount(0);
  const proxyCalls = await page.evaluate(() => (window as typeof window & { __PROXY_CONNECT_CALLS__?: number }).__PROXY_CONNECT_CALLS__ || 0);
  expect(proxyCalls).toBe(0);
});
