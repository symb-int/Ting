import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config.ting';

const baseURL = process.env.TING_BASE_URL || 'http://localhost:3097';

export default defineConfig({
  ...baseConfig,
  testMatch: 'intake.spec.ts',
  timeout: 60_000,
  use: {
    ...baseConfig.use,
    baseURL,
    viewport: { width: 1440, height: 900 },
    video: 'off',
    launchOptions: {
      ...(process.env.TING_CHROMIUM_PATH ? { executablePath: process.env.TING_CHROMIUM_PATH } : {}),
      args: ['--no-sandbox'],
    },
  },
  webServer: {
    command: 'node e2e/setup/start-ting.js',
    cwd: process.cwd(),
    env: { TING_BASE_URL: baseURL },
    url: `${baseURL}/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
