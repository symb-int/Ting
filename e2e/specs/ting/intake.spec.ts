import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { TingCatalogResponse, TingProcedureDto } from 'librechat-data-provider';

const run = promisify(execFile);
const projectRoot = path.resolve(__dirname, '../../..');
const runId = `${Date.now()}-${process.pid}`;
const password = `Ting-I02-${runId}-A1!`;
const operator = { name: 'Werkstatt Betreiber', email: `ting-i02-operator-${runId}@example.de` };
const citizen = { name: 'Bürgerin Anliegen', email: `ting-i02-citizen-${runId}@example.de` };

async function register(page: Page, user: typeof operator) {
  await page.goto('/register');
  await page.getByLabel('Vollständiger Name').fill(user.name);
  await page.getByLabel('E-Mail-Adresse').fill(user.email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await page.getByLabel('Passwort bestätigen', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Konto erstellen', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
}

async function login(page: Page, user: typeof operator, destination = '/c/new') {
  await page.goto('/login');
  await page.getByLabel('E-Mail-Adresse').fill(user.email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  const response = page.waitForResponse(
    (res) => res.url().endsWith('/api/auth/login') && res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  const session = (await (await response).json()) as { token: string; user: { id: string } };
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
  if (destination !== '/c/new') await page.goto('/c/new');
  await expect(page.getByRole('textbox', { name: 'Nachrichteneingabe' })).toBeVisible();
  return session;
}

async function procedureAccess(action: 'grant' | 'revoke', userId: string) {
  const config = JSON.parse(
    await readFile(path.join(projectRoot, 'e2e/.generated/ting/runtime-env.json'), 'utf8'),
  ) as { MONGO_URI?: string };
  if (!config.MONGO_URI) throw new Error('Isolated I02 test Mongo URI is missing.');
  await run(process.execPath, ['scripts/ting/procedures-access.mjs', action, '--user-id', userId], {
    cwd: projectRoot,
    env: { ...process.env, MONGO_URI: config.MONGO_URI },
  });
}

function mutationResponse(page: Page, method: 'POST' | 'PUT', status = 200) {
  return page.waitForResponse(
    (res) =>
      res.url().includes('/api/ting/procedures') &&
      res.request().method() === method &&
      res.status() === status,
  );
}

test('I02: real workshop permissions, publication, conflict, direct procedure start and persistence', async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  test.setTimeout(120_000);
  const citizenContext = await browser.newContext({
    baseURL,
    locale: 'de-DE',
    viewport: { width: 1440, height: 900 },
  });
  const citizenPage = await citizenContext.newPage();
  try {
    expect((await page.request.get('/api/ting/procedures')).status()).toBe(401);
    await page.goto('/werkstatt/verfahren');
    await expect(page).toHaveURL(/\/login/);
    await register(page, operator);
    await register(citizenPage, citizen);
    const operatorSession = await login(page, operator, '/werkstatt/verfahren');
    const citizenSession = await login(citizenPage, citizen);
    const citizenHeaders = { Authorization: `Bearer ${citizenSession.token}` };

    await citizenPage.goto('/werkstatt/verfahren');
    await expect(
      citizenPage.getByText('Ihr Konto hat keinen Zugang zur Werkstatt.', { exact: true }),
    ).toBeVisible();
    expect(
      (await citizenPage.request.get('/api/ting/procedures', { headers: citizenHeaders })).status(),
    ).toBe(403);
    expect(
      (
        await citizenPage.request.post('/api/ting/procedures', {
          headers: citizenHeaders,
          data: {},
        })
      ).status(),
    ).toBe(403);
    await procedureAccess('grant', citizenSession.user.id);
    await citizenPage.reload();
    await expect(citizenPage.getByText('Noch keine Verfahren', { exact: true })).toBeVisible();
    await procedureAccess('revoke', citizenSession.user.id);
    await citizenPage.reload();
    await expect(
      citizenPage.getByText('Ihr Konto hat keinen Zugang zur Werkstatt.', { exact: true }),
    ).toBeVisible();

    await page.goto('/werkstatt/verfahren');
    await expect(page.getByText('Noch keine Verfahren', { exact: true })).toBeVisible();
    await expect(page.locator('.ting-empty-state')).toHaveCSS('border-style', 'dashed');
    await page.getByRole('link', { name: 'Verfahren anlegen', exact: true }).click();
    await expect(page).toHaveURL(/\/werkstatt\/verfahren\/neu$/);
    await page.getByRole('button', { name: 'Entwurf speichern', exact: true }).click();
    await expect(
      page.getByText('Bitte einen Titel mit 1 bis 160 Zeichen eingeben.', { exact: true }),
    ).toBeVisible();
    const title = `Wohnkostenzuschuss ${runId}`;
    const description =
      'Unterstützung bei laufenden Mietkosten. Dieses Verfahren betrifft keine Suche nach einer Wohnung.';
    await page.getByLabel('Titel', { exact: false }).fill(title);
    const draftResponse = mutationResponse(page, 'POST');
    await page.getByRole('button', { name: 'Entwurf speichern', exact: true }).click();
    const draft = (await (await draftResponse).json()) as TingProcedureDto;
    expect(draft.published).toBeNull();
    await expect(page).toHaveURL(new RegExp(`/werkstatt/verfahren/${draft.procedureId}$`));
    const unpublishedCatalog = (await (
      await citizenPage.request.get('/api/ting/catalog', { headers: citizenHeaders })
    ).json()) as TingCatalogResponse;
    expect(unpublishedCatalog.procedures).toEqual([]);

    await page.getByLabel('Beschreibung', { exact: false }).fill(description);
    const publishResponse = mutationResponse(page, 'PUT');
    await page.getByRole('button', { name: 'Veröffentlichen', exact: true }).click();
    const published = (await (await publishResponse).json()) as TingProcedureDto;
    expect(published.published?.version).toBe(1);
    await page.reload();
    await expect(page.getByLabel('Titel', { exact: false })).toHaveValue(title);
    await expect(page.getByLabel('Beschreibung', { exact: false })).toHaveValue(description);
    await expect(page.getByText('Veröffentlicht', { exact: true })).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath('workshop-published-desktop.png'),
      fullPage: true,
    });

    const secondEditor = await page.context().newPage();
    await secondEditor.goto(`/werkstatt/verfahren/${draft.procedureId}`);
    await expect(secondEditor.getByLabel('Titel', { exact: false })).toHaveValue(title);
    await secondEditor.getByLabel('Titel', { exact: false }).fill(`${title} zweite Bearbeitung`);
    await page.getByLabel('Titel', { exact: false }).fill(`${title} neue Fassung`);
    const updateResponse = mutationResponse(page, 'PUT');
    await page.getByRole('button', { name: 'Entwurf speichern', exact: true }).click();
    await updateResponse;
    const conflictResponse = mutationResponse(secondEditor, 'PUT', 409);
    await secondEditor
      .getByRole('button', { name: 'Änderungen veröffentlichen', exact: true })
      .click();
    await conflictResponse;
    await expect(secondEditor.getByLabel('Titel', { exact: false })).toHaveValue(
      `${title} zweite Bearbeitung`,
    );
    await expect(
      secondEditor.getByText(
        'Das Verfahren wurde inzwischen geändert. Ihre Eingaben bleiben erhalten; der gespeicherte Stand wurde nicht überschrieben.',
        { exact: true },
      ),
    ).toBeVisible();
    await secondEditor.close();

    const catalog = (await (
      await citizenPage.request.get('/api/ting/catalog', { headers: citizenHeaders })
    ).json()) as TingCatalogResponse;
    expect(catalog.procedures).toHaveLength(1);
    expect(catalog.procedures[0].title).toBe(title);
    expect(catalog.procedures[0].revisionId).toBe(published.published?.revisionId);
    await citizenPage.goto('/c/new');
    const composer = citizenPage.getByRole('textbox', { name: 'Nachrichteneingabe' });
    await composer.fill('Diese zusätzliche Nachricht bleibt als Entwurf stehen.');
    await citizenPage.getByRole('button', { name: title, exact: true }).click();
    await expect(
      citizenPage
        .locator('.message-render')
        .getByText(`Wir beginnen mit dem Verfahren „${title}“.`, { exact: true }),
    ).toBeVisible();
    await expect(composer).toHaveValue('Diese zusätzliche Nachricht bleibt als Entwurf stehen.');
    await expect(citizenPage).toHaveURL(/\/c\/(?!new$)[^/]+$/);
    const conversationPath = new URL(citizenPage.url()).pathname;
    await citizenPage.reload();
    await expect(
      citizenPage
        .locator('.message-render')
        .getByText(`Wir beginnen mit dem Verfahren „${title}“.`, { exact: true }),
    ).toBeVisible();
    await expect(
      citizenPage.getByRole('button', { name: 'Ja, das passt', exact: true }),
    ).toHaveCount(0);
    await citizenPage.screenshot({
      path: testInfo.outputPath('procedure-start-desktop.png'),
      fullPage: true,
    });

    for (const width of [800, 799, 320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.locator('.ting-workshop').evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
    }
    await page.screenshot({ path: testInfo.outputPath('workshop-mobile.png'), fullPage: true });
    expect(
      (
        await page.request.get(`/api/messages/${conversationPath.split('/').pop()}`, {
          headers: { Authorization: `Bearer ${operatorSession.token}` },
        })
      ).status(),
    ).toBeGreaterThanOrEqual(400);
  } finally {
    await citizenContext.close();
  }
});
