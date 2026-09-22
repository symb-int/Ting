import { chromium } from '@playwright/test';
import type { FullConfig, Page } from '@playwright/test';
import type { User } from '../types';
import cleanupUser from './cleanupUser';
import dotenv from 'dotenv';
dotenv.config();

const timeout = Number(process.env.E2E_AUTH_TIMEOUT ?? 15000);
const chromiumChannel = process.env.E2E_CHROMIUM_CHANNEL || undefined;

async function register(page: Page, user: User, registerURL: string) {
  await page.goto(registerURL, { timeout });
  await page.getByTestId('name').fill(user.name);
  await page.getByTestId('email').fill(user.email);
  await page.getByTestId('password').click();
  await page.getByTestId('password').fill(user.password);
  await page.getByTestId('confirm_password').click();
  await page.getByTestId('confirm_password').fill(user.password);
  await page.locator('form button[type="submit"]').click();
}

async function registrationErrorIsVisible(page: Page) {
  return page
    .getByTestId('registration-error')
    .isVisible({ timeout: 500 })
    .catch(() => false);
}

async function login(page: Page, user: User) {
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.getByTestId('login-button').click();
}

function appURL(baseURL: string, pathname = '') {
  const normalizedBaseURL = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
  return new URL(pathname.replace(/^\/+/, ''), normalizedBaseURL).toString();
}

async function authenticate(config: FullConfig, user: User) {
  console.log('Global setup has started');
  const { baseURL, storageState } = config.projects[0].use;
  console.log('Using baseURL', baseURL);
  console.log('Using E2E user:', user.email);
  if (typeof storageState !== 'string') {
    throw new Error('storageState must be a file path');
  }

  const browser = await chromium.launch({
    headless: config.projects[0].use.headless ?? true,
    ...(chromiumChannel ? { channel: chromiumChannel } : {}),
    ...config.projects[0].use.launchOptions,
  });
  try {
    const page = await browser.newPage();
    console.log('Authenticating user:', user.email);

    if (typeof baseURL !== 'string') {
      throw new Error('baseURL is not defined');
    }
    const conversationURL = appURL(baseURL, 'c/new');
    const loginURL = appURL(baseURL, 'login');
    const registerURL = appURL(baseURL, 'register');

    // Set localStorage before navigating to the page
    await page.context().addInitScript(() => {
      localStorage.setItem('navVisible', 'true');
    });
    console.log('localStorage: set Nav as visible', storageState);

    await register(page, user, registerURL);
    try {
      await page.waitForURL(loginURL, { timeout });
    } catch (error) {
      console.error('Error:', error);
      if (await registrationErrorIsVisible(page)) {
        console.log('User already exists; recreating test user');
        await cleanupUser(user);
        await register(page, user, registerURL);
        await page.waitForURL(loginURL, { timeout });
      } else {
        throw new Error('User failed to register');
      }
    }
    console.log('User successfully registered');

    await page.goto(loginURL, { timeout });
    await login(page, user);
    await page.waitForURL(conversationURL, { timeout });
    console.log('User successfully authenticated');

    await page.context().storageState({ path: storageState });
    console.log('Authentication state saved in', storageState);
  } finally {
    await browser.close();
    console.log('Global setup has finished');
  }
}

export default authenticate;
