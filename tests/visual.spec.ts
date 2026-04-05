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

  await page.locator('.platform-chat-row').first().click();
  await expect(page.getByPlaceholder('Введите сообщение...')).toBeVisible();
  await stabilize(page);
  await page.waitForTimeout(200);

  await expect(page.locator('.platform-chat-shell')).toHaveScreenshot('chats-mobile-thread.png');
});
