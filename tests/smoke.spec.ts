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

test('desktop shell: no burger, stable sidebar collapse and no sidebar overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/dashboard');
  await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Открыть меню' })).toBeHidden();

  const sidebar = page.locator('.platform-desktop-sidebar');
  await expect(sidebar).toBeVisible();

  const collapseButton = page.locator('.platform-topbar .platform-sidebar-toggle');

  await expect(collapseButton).toBeVisible();
  const before = await collapseButton.getAttribute('aria-label');
  await collapseButton.click();
  await expect(collapseButton).toHaveAttribute(
    'aria-label',
    before === 'Свернуть меню' ? 'Развернуть меню' : 'Свернуть меню',
  );

  const hasSidebarOverflow = await sidebar.evaluate(el => el.scrollWidth > el.clientWidth + 1);
  expect(hasSidebarOverflow).toBeFalsy();
  await assertNoHorizontalOverflow(page);
});

test('mobile shell: only burger + drawer, no bottom bar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/platform/dashboard');
  await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible();

  const burger = page.getByRole('button', { name: 'Открыть меню' });
  await expect(burger).toBeVisible();

  await burger.click();
  await expect(page.locator('.platform-mobile-sidebar.open button[aria-label="Закрыть меню"]')).toBeVisible();

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

test('mobile chats follows messenger flow: list -> thread -> info -> back', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/platform/chats');
  await expect(page.getByRole('heading', { name: 'Чаты' })).toBeVisible();

  const firstChat = page.locator('.platform-chat-row').first();
  await expect(firstChat).toBeVisible();

  await expect(page.getByPlaceholder('Введите сообщение...')).toBeHidden();

  await firstChat.click();
  await expect(page.locator('.platform-chat-thread')).not.toHaveClass(/mobile-thread-collapsed/);
  await expect(page.getByRole('button', { name: 'Назад к чатам' })).toBeVisible();
  await expect(page.getByPlaceholder('Введите сообщение...')).toBeVisible();

  await page.getByRole('button', { name: 'Информация по чату' }).click();
  await expect(page.locator('.mobile-sheet')).toBeVisible();

  await page.locator('.mobile-sheet').getByRole('button', { name: 'Закрыть' }).click();
  await expect(page.locator('.mobile-sheet')).toBeHidden();

  await page.getByRole('button', { name: 'Назад к чатам' }).click();
  await expect(page.getByPlaceholder('Введите сообщение...')).toBeHidden();

  await assertNoHorizontalOverflow(page);
});

test('desktop chats keeps split view list + thread', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/platform/chats');

  await expect(page.locator('.platform-chat-list')).toBeVisible();
  await expect(page.locator('.platform-chat-thread')).toBeVisible();
  const composer = page.getByPlaceholder('Введите сообщение...');
  if (!(await composer.isVisible())) {
    await page.locator('.platform-chat-row').first().click();
  }
  await expect(page.getByPlaceholder('Введите сообщение...')).toBeVisible();
});
