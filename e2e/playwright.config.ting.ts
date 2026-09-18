import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const baseURL = process.env.TING_BASE_URL ?? 'http://localhost:3080';

export default defineConfig({
  testDir: 'specs/ting',
  outputDir: 'specs/.ting-results',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report-ting', open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    locale: 'de-DE',
    colorScheme: 'light',
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  snapshotPathTemplate: path.join('{testDir}', '__snapshots__', '{testFilePath}', '{arg}{ext}'),
});
