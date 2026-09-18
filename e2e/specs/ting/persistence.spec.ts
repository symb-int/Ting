import { expect, test } from '@playwright/test';

const email = process.env.TING_PERSIST_EMAIL;
const password = process.env.TING_PERSIST_PASSWORD;

test('B06: bestehendes Konto bleibt nach App- und Datenbankneustart nutzbar', async ({ page }) => {
  test.skip(!email || !password, 'TING_PERSIST_EMAIL und TING_PERSIST_PASSWORD fehlen');

  await page.goto('/login');
  await page.getByLabel('E-Mail-Adresse').fill(email!);
  await page.getByLabel('Passwort', { exact: true }).fill(password!);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();

  await expect(page).toHaveURL(/\/c\/new$/);
  await expect(page.getByRole('textbox', { name: 'Nachrichteneingabe' })).toBeVisible();
  await page.getByTestId('nav-user').click();
  await expect(page.getByText(email!, { exact: true })).toBeVisible();
});
