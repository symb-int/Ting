import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const runId = `${Date.now()}-${process.pid}`;
const password = `Ting-${runId}-A1!`;

const users = [
  {
    name: 'Anna Nachweis',
    username: `anna-${runId}`,
    email: `ting-i01-anna-${runId}@example.de`,
    password,
  },
  {
    name: 'Boris Nachweis',
    username: `boris-${runId}`,
    email: `ting-i01-boris-${runId}@example.de`,
    password,
  },
] as const;

type TestUser = (typeof users)[number];

async function fillRegistration(page: Page, user: TestUser) {
  await page.getByLabel('Vollständiger Name').fill(user.name);
  await page.getByLabel('Benutzername (optional)').fill(user.username);
  await page.getByLabel('E-Mail-Adresse').fill(user.email);
  await page.getByLabel('Passwort', { exact: true }).fill(user.password);
  await page.getByLabel('Passwort bestätigen', { exact: true }).fill(user.password);
}

async function register(page: Page, user: TestUser) {
  await page.goto('/register');
  await fillRegistration(page, user);
  await page.getByRole('button', { name: 'Konto erstellen', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Sie können sich jetzt anmelden.', { exact: true })).toBeVisible();
}

async function login(page: Page, user: TestUser, loginPassword = user.password) {
  await page.goto('/login');
  await page.getByLabel('E-Mail-Adresse').fill(user.email);
  await page.getByLabel('Passwort', { exact: true }).fill(loginPassword);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
}

async function expectLoggedIn(page: Page) {
  await expect(page).toHaveURL(/\/c\/new$/);
  await expect(page.getByRole('textbox', { name: 'Nachrichteneingabe' })).toBeVisible();
}

async function openAccountMenu(page: Page) {
  const accountButton = page.getByTestId('nav-user');
  await expect(accountButton).toBeVisible();
  await accountButton.click();
}

test.describe.serial('TING I01 Basisprüfung ohne Modellzugang', () => {
  test('B02: native Validierung, zwei Konten und neutrale Doppelregistrierung', async ({
    page,
  }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Konto erstellen', exact: true }).click();
    await expect(page.getByText('Name ist erforderlich', { exact: true })).toBeVisible();
    await expect(page.getByText('E-Mail ist erforderlich', { exact: true })).toBeVisible();
    await expect(page.getByText('Passwort ist erforderlich', { exact: true })).toBeVisible();

    await page.getByLabel('Vollständiger Name').fill(users[0].name);
    await page.getByLabel('Benutzername (optional)').fill(users[0].username);
    await page.getByLabel('E-Mail-Adresse').fill(users[0].email);
    await page.getByLabel('Passwort', { exact: true }).fill(users[0].password);
    await page.getByLabel('Passwort bestätigen', { exact: true }).fill('anderes-passwort');
    await expect(page.getByText('Passwörter stimmen nicht überein', { exact: true })).toBeVisible();

    await page.getByLabel('Passwort bestätigen', { exact: true }).fill(users[0].password);
    await page.getByRole('button', { name: 'Konto erstellen', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Sie können sich jetzt anmelden.', { exact: true })).toBeVisible();

    await register(page, users[1]);

    await page.goto('/register');
    await fillRegistration(page, users[0]);
    await page.getByRole('button', { name: 'Konto erstellen', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Sie können sich jetzt anmelden.', { exact: true })).toBeVisible();
  });

  test('B03 und B05: ungültige und gültige Anmeldung, Kontowechsel und Abmeldung', async ({
    page,
  }) => {
    await login(page, users[0], `${users[0].password}-falsch`);
    await expect(
      page.getByText(
        'Anmeldung mit den angegebenen Informationen nicht möglich. Bitte überprüfe deine Anmeldedaten und versuche es erneut.',
        { exact: true },
      ),
    ).toBeVisible();

    await page.getByLabel('E-Mail-Adresse').fill(users[0].email);
    await page.getByLabel('Passwort', { exact: true }).fill(users[0].password);
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expectLoggedIn(page);
    await openAccountMenu(page);
    await expect(page.getByText(users[0].email, { exact: true })).toBeVisible();
    await page.getByRole('menuitem', { name: 'Abmelden', exact: true }).click();
    await expect(page).toHaveURL(/\/login/);

    await login(page, users[1]);
    await expectLoggedIn(page);
    await openAccountMenu(page);
    await expect(page.getByText(users[1].email, { exact: true })).toBeVisible();
    await expect(page.getByText(users[0].email, { exact: true })).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'Abmelden', exact: true }).click();
    await page.reload();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/c/new');
    await expect(page).toHaveURL(/\/login/);
  });

  test('B04 und B07: leerer Verlauf, Suche und erhaltener Entwurf ohne Modell', async ({
    page,
  }) => {
    await login(page, users[0]);
    await expectLoggedIn(page);
    await expect(page.getByText('Noch keine Vorgänge', { exact: true })).toBeVisible();

    const search = page.getByRole('textbox', { name: 'Vorgänge durchsuchen' });
    await search.fill(`nicht-vorhanden-${runId}`);
    await expect(page.getByText('Keine Vorgänge gefunden', { exact: true })).toBeVisible();
    await search.fill('');

    const message = `Unkonfigurierter Entwurf ${runId}`;
    const composer = page.getByRole('textbox', { name: 'Nachrichteneingabe' });
    await composer.fill(message);
    await page.getByRole('button', { name: 'An TING senden', exact: true }).click();
    await expect(
      page.getByText('TING kann gerade nicht antworten. Bitte versuchen Sie es später erneut.', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(composer).toHaveValue(message);
    await expect(page).toHaveURL(/\/c\/new$/);
  });

  test('B09: mobiler Drawer schließt per Escape und Scrim und hält den Fokus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, users[0]);
    await expectLoggedIn(page);

    const openButton = page.getByRole('button', { name: 'Seitenleiste öffnen', exact: true });
    await openButton.click();

    const drawer = page.locator('#mobile-drawer');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(
      drawer.getByRole('button', { name: 'Seitenleiste schließen', exact: true }),
    ).toBeFocused();

    await page.keyboard.press('Tab');
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.querySelector('#mobile-drawer')?.contains(document.activeElement),
        ),
      )
      .toBe(true);

    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveAttribute('aria-modal', 'true');
    await expect(openButton).toBeFocused();

    await openButton.click();
    const scrim = page.locator('#mobile-drawer-scrim');
    await expect(scrim).toBeVisible();
    await scrim.click();
    await expect(drawer).not.toHaveAttribute('aria-modal', 'true');
    await expect(openButton).toBeFocused();
  });
});
