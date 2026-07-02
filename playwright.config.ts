import { defineConfig, devices } from '@playwright/test';

/**
 * Golden-path UI automation for FactoryShield.
 *
 * Assumes the .NET API (with a seeded dev database) is already running on
 * http://localhost:5263 — Playwright only manages the Angular dev server.
 * See e2e/README.md for how to run this locally.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm start',
    cwd: 'frontend',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
