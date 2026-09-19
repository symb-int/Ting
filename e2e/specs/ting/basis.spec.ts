import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Cookie, Page } from '@playwright/test';

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
let primarySessionCookies: Cookie[] = [];

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

function authenticatorCode(secret: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = [...secret]
    .map((char) => alphabet.indexOf(char).toString(2).padStart(5, '0'))
    .join('');
  const bytes = bits.match(/.{8}/g) ?? [];
  const key = Buffer.from(bytes.map((byte) => parseInt(byte, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const hash = createHmac('sha1', key).update(counter).digest();
  const offset = hash[hash.length - 1] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, '0');
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
    primarySessionCookies = await page.context().cookies();
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
    await page.context().addCookies(primarySessionCookies);
    await page.goto('/c/new');
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
    primarySessionCookies = await page.context().cookies();
  });

  test('B10: Kontoseite, Browsernavigation und gespeicherte Chatpräferenzen', async ({ page }) => {
    await page.context().addCookies(primarySessionCookies);
    await page.goto('/c/new');
    await expectLoggedIn(page);
    await openAccountMenu(page);
    await page.getByTestId('nav-settings').click();
    await expect(page).toHaveURL(/\/settings$/);
    const main = page.getByRole('main', { name: 'Konto', exact: true });
    await expect(main).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(main.getByText(users[0].email, { exact: true })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Bild ändern' })).toBeVisible();
    await expect(main.getByRole('button', { name: '2FA aktivieren' })).toBeVisible();
    const enterToSend = main.getByTestId('enterToSend');
    const original = await enterToSend.getAttribute('aria-checked');
    await enterToSend.click();
    await expect(enterToSend).toHaveAttribute(
      'aria-checked',
      original === 'true' ? 'false' : 'true',
    );
    await page.reload();
    await expect(enterToSend).toHaveAttribute(
      'aria-checked',
      original === 'true' ? 'false' : 'true',
    );
    await enterToSend.click();

    for (const width of [1440, 1024, 800, 799, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(main).toBeVisible();
      expect(await main.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    }
    await page.goBack();
    await expectLoggedIn(page);
    await page.goForward();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(main).toBeVisible();
    await page.getByRole('button', { name: 'Seitenleiste öffnen', exact: true }).click();
    await openAccountMenu(page);
    await page.getByRole('menuitem', { name: 'Abmelden', exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });
  test('B11: verzögerte Anmeldung hält Eingaben und sperrt Mehrfachsubmit', async ({ page }) => {
    let releaseRequest: () => void = () => undefined;
    const requestGate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });
    await page.route('**/api/auth/login', async (route) => {
      await requestGate;
      await route.continue();
    });
    await login(page, users[0]);
    const submit = page.getByRole('button', { name: 'Anmelden', exact: true });
    await expect(submit).toBeDisabled();
    await expect(page.getByLabel('E-Mail-Adresse')).toHaveValue(users[0].email);
    await expect(page.getByLabel('Passwort', { exact: true })).toHaveValue(users[0].password);
    releaseRequest();
    await expectLoggedIn(page);
    await openAccountMenu(page);
    await page.getByRole('menuitem', { name: 'Archivierte Vorgänge', exact: true }).click();
    await expect(page.getByText('Noch keine archivierten Vorgänge', { exact: true })).toBeVisible();
    await expect(
      page.locator('.ting-empty-state').filter({ hasText: 'Noch keine archivierten Vorgänge' }),
    ).toHaveCSS('border-style', 'dashed');
  });

  test('B12: echte 2FA, Backup-Download, Schließen, Neuanmeldung und Deaktivierung', async ({
    page,
  }) => {
    await login(page, users[1]);
    await expectLoggedIn(page);
    await page.goto('/settings');
    await page.getByRole('button', { name: '2FA aktivieren', exact: true }).click();
    await page.getByRole('button', { name: 'QR-Code generieren', exact: true }).click();
    const secret = await page.getByLabel('Geheimschlüssel', { exact: true }).inputValue();
    await page.setViewportSize({ width: 320, height: 720 });
    const dialog = page.getByRole('dialog');
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.getByRole('button', { name: 'Fortfahren', exact: true }).click();
    await page
      .getByLabel('Authentifizierungscode', { exact: true })
      .fill(authenticatorCode(secret));
    expect(
      await dialog.locator('.dialog__body').evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.getByRole('button', { name: 'Überprüfen', exact: true }).click();
    const downloadButton = page.getByRole('button', {
      name: 'Backup-Codes herunterladen',
      exact: true,
    });
    await expect(downloadButton).toBeVisible();
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    const downloadEvent = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadEvent;
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const codes = (await readFile(downloadPath!, 'utf8')).trim().split('\n');
    expect(codes.length).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page.getByRole('button', { name: '2FA deaktivieren', exact: true })).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await openAccountMenu(page);
    await page.getByRole('menuitem', { name: 'Abmelden', exact: true }).click();
    await login(page, users[1]);
    await page
      .getByLabel('Authentifizierungscode', { exact: true })
      .fill(authenticatorCode(secret));
    await page.getByRole('button', { name: 'Fortfahren', exact: true }).click();
    await expectLoggedIn(page);
    await page.goto('/settings');
    await page.getByRole('button', { name: '2FA deaktivieren', exact: true }).click();
    await page
      .getByRole('button', { name: 'Stattdessen Backup-Code verwenden', exact: true })
      .click();
    await page.setViewportSize({ width: 320, height: 720 });
    await page.getByLabel('Backup-Code', { exact: true }).fill(codes[0]);
    expect(
      await dialog.locator('.dialog__body').evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: '2FA deaktivieren', exact: true })
      .click();
    await expect(page.getByRole('dialog', { name: '2FA deaktivieren', exact: true })).toHaveCount(
      0,
    );
    await page.reload();
    await expect(page.getByRole('button', { name: '2FA aktivieren', exact: true })).toBeVisible();
  });
});
