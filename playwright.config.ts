import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: {
    timeout: 8_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    colorScheme: 'dark',
    locale: 'ru-RU',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3100',
    url: 'http://localhost:3100/platform/dashboard',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: 'http://localhost:3100',
    },
  },
});
