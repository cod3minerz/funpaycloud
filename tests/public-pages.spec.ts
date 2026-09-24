import { expect, test, type Page } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

const visualRoutes = [
  { name: 'landing', path: '/', selector: 'h1' },
  { name: 'blog-feed', path: '/blog', selector: '[data-public-ui]' },
  { name: 'blog-article', path: '/blog/kak-rabotaet-avtopodnyatie-na-funpay', selector: '[data-public-ui]' },
] as const;

async function stabilize(page: Page) {
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await page.evaluate(() => document.fonts.ready);
}

async function expectNoPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({ viewport: window.innerWidth, page: document.documentElement.scrollWidth }));
  expect(overflow.page, `page overflow: ${JSON.stringify(overflow)}`).toBeLessThanOrEqual(overflow.viewport + 1);
}

for (const viewport of viewports) {
  test.describe(`public ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of visualRoutes) {
      test(`${route.name} is stable`, async ({ page }) => {
        await page.goto(route.path, { waitUntil: 'networkidle' });
        await stabilize(page);
        await expect(page.locator(route.selector)).toBeVisible();
        await expectNoPageOverflow(page);
        await expect(page).toHaveScreenshot(`${route.name}-${viewport.name}.png`, { fullPage: true });
      });
    }
  });
}

test('only the landing and blog remain available', async ({ request }) => {
  const available = ['/', '/blog', '/blog/kak-rabotaet-avtopodnyatie-na-funpay'];
  for (const path of available) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }

  const archived = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot',
    '/login',
    '/platform',
    '/platform/accounts',
    '/oldplatform/dashboard',
    '/v2-dashboard',
    '/ops/login',
    '/miniapp',
    '/about',
    '/legal/privacy',
    '/r/example',
    '/funpay-bot',
  ];
  for (const path of archived) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(410);
    expect(response.headers()['x-robots-tag']).toContain('noindex');
  }

  const adminGet = await request.get('/admin-api/users');
  const adminPost = await request.post('/admin-api/users', { data: { enabled: true } });
  const registerPost = await request.post('/auth/register', { data: { email: 'blocked@example.com' } });
  const apiPost = await request.post('/api/auth/register', { data: { email: 'blocked@example.com' } });
  expect(adminGet.status()).toBe(410);
  expect(adminPost.status()).toBe(410);
  expect(registerPost.status()).toBe(410);
  expect(apiPost.status()).toBe(410);
});

test('blog CTAs no longer lead to retired signup or feature pages', async ({ page }) => {
  await page.goto('/blog/kak-rabotaet-avtopodnyatie-na-funpay');
  await expect(page.getByRole('link', { name: 'Начать бесплатно' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Попробовать бесплатно' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Наш канал' }).first()).toHaveAttribute('href', 'https://t.me/funpay_cloud');
});

test('sitemap only advertises the homepage and blog', async ({ request }) => {
  const index = await request.get('/sitemap.xml');
  expect(index.status()).toBe(200);
  const indexText = await index.text();
  expect(indexText).toContain('/sitemap-main.xml');
  expect(indexText).toContain('/sitemap-blog.xml');
  expect(indexText).not.toContain('/sitemap-legal.xml');

  const main = await request.get('/sitemap-main.xml');
  const mainText = await main.text();
  expect(main.status()).toBe(200);
  expect(mainText).toContain('https://funpay.cloud</loc>');
  expect(mainText).not.toContain('funpay-bot');
});
