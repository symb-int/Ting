import path from 'node:path';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { expect, test } from '@playwright/test';
import type { Cookie, Locator, Page } from '@playwright/test';

const executeFile = promisify(execFile);
const repositoryRoot = path.resolve(process.cwd());
const envPath = path.join(repositoryRoot, '.env');
const composePath = path.join(repositoryRoot, 'compose.ting.yaml');
const providerEnabled = process.env.TING_PROVIDER_E2E === '1';
const runId = `${Date.now()}-${process.pid}`;
const password = `Ting-${runId}-A1!`;

const users = [
  {
    name: 'Paula Provider',
    username: `paula-${runId}`,
    email: `ting-i01-provider-a-${runId}@example.de`,
    password,
  },
  {
    name: 'Peer Provider',
    username: `peer-${runId}`,
    email: `ting-i01-provider-b-${runId}@example.de`,
    password,
  },
] as const;

type TestUser = (typeof users)[number];
type ProviderSnapshot = {
  contents: string;
  mode: number;
  key: string;
  model: string;
};
type ConversationSearchResponse = {
  conversations?: Array<{ conversationId?: string }>;
};

let providerSnapshot: ProviderSnapshot | undefined;
let primarySessionCookies: Cookie[] = [];
let firstConversationId = '';
let secondConversationId = '';
let firstSearchToken = '';
let firstPrompt = '';
let secondPrompt = '';
let firstReplyEvidence = '';
let secondReplyEvidence = '';

function envValue(contents: string, name: 'OPENAI_API_KEY' | 'OPENAI_MODELS'): string {
  const match = contents.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match?.[1]?.trim() ?? '';
}

function replaceEnvValue(
  contents: string,
  name: 'OPENAI_API_KEY' | 'OPENAI_MODELS',
  value: string,
): string {
  const expression = new RegExp(`^${name}=.*$`, 'm');
  if (!expression.test(contents)) {
    throw new Error(`Die lokale Umgebung enthaelt ${name} nicht.`);
  }
  return contents.replace(expression, () => `${name}=${value}`);
}

async function runCommand(label: string, command: string, args: string[]): Promise<string> {
  try {
    const result = await executeFile(command, args, {
      cwd: repositoryRoot,
      encoding: 'utf8',
      timeout: 180_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return result.stdout.trim();
  } catch {
    throw new Error(`Betriebsschritt fehlgeschlagen: ${label}`);
  }
}

async function waitForAppHealth(): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:3080/health');
      if (response.ok) {
        return;
      }
    } catch {
      // A connection failure is expected while Compose replaces the API container.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('TING wurde nach dem Neustart nicht rechtzeitig gesund.');
}

async function waitForServiceHealth(service: 'mongodb'): Promise<void> {
  const containerId = await runCommand('Container bestimmen', 'docker', [
    'compose',
    '-f',
    composePath,
    'ps',
    '-q',
    service,
  ]);
  if (!containerId) {
    throw new Error(`Compose-Dienst ${service} laeuft nicht.`);
  }

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const status = await runCommand('Dienstzustand pruefen', 'docker', [
      'inspect',
      '--format',
      '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}',
      containerId,
    ]);
    if (status === 'healthy') {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Compose-Dienst ${service} wurde nicht rechtzeitig gesund.`);
}

async function recreateApi(): Promise<void> {
  await runCommand('API neu erstellen', 'docker', [
    'compose',
    '-f',
    composePath,
    'up',
    '-d',
    '--force-recreate',
    '--no-deps',
    'api',
  ]);
  await waitForAppHealth();
}

async function applyProviderValues(key: string, model: string): Promise<void> {
  const current = await fs.readFile(envPath, 'utf8');
  const withKey = replaceEnvValue(current, 'OPENAI_API_KEY', key);
  const updated = replaceEnvValue(withKey, 'OPENAI_MODELS', model);
  await fs.writeFile(envPath, updated, { mode: providerSnapshot?.mode ?? 0o600 });
  await fs.chmod(envPath, providerSnapshot?.mode ?? 0o600);
  await runCommand('TING-Konfiguration aktualisieren', process.execPath, [
    'scripts/ting/setup.mjs',
  ]);
  await recreateApi();
}

async function restoreProviderRuntime(): Promise<void> {
  if (!providerSnapshot) {
    return;
  }
  await fs.writeFile(envPath, providerSnapshot.contents, { mode: providerSnapshot.mode });
  await fs.chmod(envPath, providerSnapshot.mode);
  await runCommand('TING-Konfiguration wiederherstellen', process.execPath, [
    'scripts/ting/setup.mjs',
  ]);
  await recreateApi();
}

async function withProviderValues(
  key: string,
  model: string,
  assertion: () => Promise<void>,
): Promise<void> {
  await applyProviderValues(key, model);
  try {
    await assertion();
  } finally {
    await restoreProviderRuntime();
  }
}

async function restartMongoAndApi(): Promise<void> {
  await runCommand('MongoDB neu starten', 'docker', [
    'compose',
    '-f',
    composePath,
    'restart',
    'mongodb',
  ]);
  await waitForServiceHealth('mongodb');
  await runCommand('API neu starten', 'docker', ['compose', '-f', composePath, 'restart', 'api']);
  await waitForAppHealth();
}

async function induceProviderNetworkFailure(): Promise<void> {
  const containerId = await runCommand('API-Container bestimmen', 'docker', [
    'compose',
    '-f',
    composePath,
    'ps',
    '-q',
    'api',
  ]);
  if (!containerId) {
    throw new Error('Der API-Container laeuft nicht.');
  }

  const hostsEntry = '\n127.0.0.1 api.openai.com\n';
  const appendHostsEntry = `require('node:fs').appendFileSync('/etc/hosts', ${JSON.stringify(hostsEntry)})`;
  await runCommand('Provider-Netzwerk unterbrechen', 'docker', [
    'exec',
    '--user',
    '0',
    containerId,
    'node',
    '-e',
    appendHostsEntry,
  ]);

  const terminateTlsHandshake =
    "const net = require('node:net'); " +
    "net.createServer((socket) => socket.end('HTTP/1.1 400 Bad Request\\r\\nConnection: close\\r\\nContent-Length: 0\\r\\n\\r\\n')).listen(443, '127.0.0.1'); " +
    'setInterval(() => {}, 2 ** 30);';
  await runCommand('Provider-TLS-Verbindung abbrechen', 'docker', [
    'exec',
    '--detach',
    '--user',
    '0',
    containerId,
    'node',
    '-e',
    terminateTlsHandshake,
  ]);
}

async function fillRegistration(page: Page, user: TestUser): Promise<void> {
  await page.getByLabel('Vollständiger Name').fill(user.name);
  await page.getByLabel('Benutzername (optional)').fill(user.username);
  await page.getByLabel('E-Mail-Adresse').fill(user.email);
  await page.getByLabel('Passwort', { exact: true }).fill(user.password);
  await page.getByLabel('Passwort bestätigen', { exact: true }).fill(user.password);
}

async function register(page: Page, user: TestUser): Promise<void> {
  await page.goto('/register');
  await fillRegistration(page, user);
  await page.getByRole('button', { name: 'Konto erstellen', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Sie können sich jetzt anmelden.', { exact: true })).toBeVisible();
}

async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-Mail-Adresse').fill(user.email);
  await page.getByLabel('Passwort', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page).toHaveURL(/\/c\/new$/);
  await expect(page.getByRole('textbox', { name: 'Nachrichteneingabe' })).toBeVisible();
}

async function loginFresh(page: Page, user: TestUser): Promise<void> {
  await page.context().clearCookies();
  await login(page, user);
}

async function restorePrimarySession(page: Page): Promise<void> {
  if (primarySessionCookies.length === 0) {
    throw new Error('Die primäre Testsitzung wurde nicht gespeichert.');
  }
  const currentCookies = await page.context().cookies();
  if (!currentCookies.some((cookie) => cookie.name === 'refreshToken')) {
    await page.context().addCookies(primarySessionCookies);
  }
  await page.goto('/c/new');
  await expect(page).toHaveURL(/\/c\/new$/);
  await expect(page.getByRole('textbox', { name: 'Nachrichteneingabe' })).toBeVisible();
  primarySessionCookies = await page.context().cookies();
}

async function logout(page: Page): Promise<void> {
  await page.getByTestId('nav-user').click();
  await page.getByRole('menuitem', { name: 'Abmelden', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
}

async function chatCapability(page: Page): Promise<string | undefined> {
  const configResponse = page.waitForResponse((response) => {
    const authorization = response.request().headers().authorization;
    return (
      response.request().method() === 'GET' &&
      new URL(response.url()).pathname === '/api/config' &&
      authorization?.startsWith('Bearer ') === true
    );
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  const response = await configResponse;
  expect(response.ok()).toBe(true);
  const config = (await response.json()) as {
    chatCapability?: { status?: string };
  };
  await expect(page.getByRole('textbox', { name: 'Nachrichteneingabe' })).toBeVisible();
  return config.chatCapability?.status;
}

function messages(page: Page): Locator {
  return page.getByTestId('screenshot-target');
}

function assistantBodies(page: Page): Locator {
  return messages(page).locator('.ting-message-row .agent-turn [data-testid="message-body"]');
}

async function currentConversationId(page: Page): Promise<string> {
  await expect(page).toHaveURL(/\/c\/[0-9a-fA-F-]{36}$/);
  const conversationId = new URL(page.url()).pathname.split('/').at(-1) ?? '';
  expect(conversationId).toMatch(/^[0-9a-fA-F-]{36}$/);
  return conversationId;
}

async function sendAndWaitForAnswer(
  page: Page,
  prompt: string,
  timeout = 150_000,
): Promise<{ conversationId: string; replyEvidence: string }> {
  const completedBefore = await page.getByTestId('copy-response-button').count();
  const providerResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().includes('/api/agents/chat/'),
    { timeout },
  );
  const composer = page.getByRole('textbox', { name: 'Nachrichteneingabe' });
  await composer.fill(prompt);
  await page.getByRole('button', { name: 'An TING senden', exact: true }).click();

  const response = await providerResponse;
  expect(response.ok()).toBe(true);
  const conversationId = await currentConversationId(page);
  await expect
    .poll(() => page.getByTestId('copy-response-button').count(), { timeout })
    .toBeGreaterThan(completedBefore);

  const latestBody = assistantBodies(page).last();
  await expect(latestBody.locator('.message-content').first()).toContainText(/\S/, { timeout });
  await expect(latestBody.getByRole('alert')).toHaveCount(0);
  const replyEvidence = (await latestBody.innerText()).trim().slice(0, 80);
  expect(replyEvidence.length).toBeGreaterThan(0);
  return { conversationId, replyEvidence };
}

async function expectStoredConversation(
  page: Page,
  conversationId: string,
  prompt: string,
  replyEvidence: string,
): Promise<void> {
  if (new URL(page.url()).pathname !== `/c/${conversationId}`) {
    await page.goto(`/c/${conversationId}`);
  }
  await expect(page.getByRole('textbox', { name: 'Nachrichteneingabe' })).toBeVisible({
    timeout: 30_000,
  });
  await expect(messages(page).getByText(prompt, { exact: true })).toBeVisible();
  await expect(assistantBodies(page).filter({ hasText: replyEvidence }).last()).toBeVisible();
}

async function openConversationMenu(
  page: Page,
  conversationId: string,
  row?: Locator,
): Promise<void> {
  let menuButton = page.locator(`#conversation-menu-${conversationId}`);
  if (row) {
    await row.hover();
    menuButton = row.getByRole('button', { name: 'Optionen des Gesprächsmenüs', exact: true });
  }
  await expect(menuButton).toBeVisible();
  await menuButton.click();
}

test.describe.serial('TING I01 Providerprüfung mit echtem Modellzugang', () => {
  test.skip(!providerEnabled, 'Nur mit TING_PROVIDER_E2E=1 ausführen.');

  test.beforeAll(async () => {
    test.setTimeout(300_000);
    const [contents, stats] = await Promise.all([fs.readFile(envPath, 'utf8'), fs.stat(envPath)]);
    const key = envValue(contents, 'OPENAI_API_KEY');
    const model = envValue(contents, 'OPENAI_MODELS');
    if (!key || !model || model.split(',').filter(Boolean).length !== 1) {
      throw new Error(
        'Provider-E2E benötigt einen Key und genau eine Modell-ID in der lokalen Umgebung.',
      );
    }
    providerSnapshot = {
      contents,
      mode: stats.mode & 0o777,
      key,
      model,
    };
    await applyProviderValues(key, model);
  });

  test.afterAll(async () => {
    test.setTimeout(300_000);
    await restoreProviderRuntime();
  });

  test.afterEach(async ({ context }, testInfo) => {
    if (testInfo.status === 'passed' && primarySessionCookies.length > 0) {
      primarySessionCookies = await context.cookies();
    }
  });

  test('P01: vollständige, Key-only- und Modell-only-Konfiguration bleiben start- und loginfähig', async ({
    page,
  }) => {
    test.setTimeout(420_000);
    if (!providerSnapshot) {
      throw new Error('Provider-Konfiguration wurde nicht geladen.');
    }

    await register(page, users[0]);
    await register(page, users[1]);
    await login(page, users[0]);
    expect(await chatCapability(page)).toBe('configured');
    await logout(page);

    await withProviderValues('', providerSnapshot.model, async () => {
      await loginFresh(page, users[0]);
      expect(await chatCapability(page)).toBe('not_configured');
      const draft = `P01 Key fehlt ${runId}`;
      const composer = page.getByRole('textbox', { name: 'Nachrichteneingabe' });
      await composer.fill(draft);
      await page.getByRole('button', { name: 'An TING senden', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText(
        'TING kann gerade nicht antworten. Bitte versuchen Sie es später erneut.',
      );
      await expect(composer).toHaveValue(draft);
      await expect(page).toHaveURL(/\/c\/new$/);
    });

    await withProviderValues(providerSnapshot.key, '', async () => {
      await loginFresh(page, users[0]);
      expect(await chatCapability(page)).toBe('not_configured');
      const draft = `P01 Modell fehlt ${runId}`;
      const composer = page.getByRole('textbox', { name: 'Nachrichteneingabe' });
      await composer.fill(draft);
      await page.getByRole('button', { name: 'An TING senden', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText(
        'TING kann gerade nicht antworten. Bitte versuchen Sie es später erneut.',
      );
      await expect(composer).toHaveValue(draft);
      await expect(page).toHaveURL(/\/c\/new$/);
    });

    await loginFresh(page, users[0]);
    expect(await chatCapability(page)).toBe('configured');
    primarySessionCookies = await page.context().cookies();
  });

  test('P02: freie Nachricht erhält eine echte sichtbare und gespeicherte Modellantwort', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    firstSearchToken = `P02-${runId}`;
    firstPrompt = `${firstSearchToken}: Erkläre in einem kurzen Satz, welche Angabe du für einen neuen Reisepass zuerst brauchst.`;
    await restorePrimarySession(page);

    const result = await sendAndWaitForAnswer(page, firstPrompt);
    firstConversationId = result.conversationId;
    firstReplyEvidence = result.replyEvidence;

    await page.reload();
    await expectStoredConversation(page, firstConversationId, firstPrompt, firstReplyEvidence);
  });

  test('P03: zwei Gespräche überleben Reload sowie App- und Mongo-Neustart', async ({ page }) => {
    test.setTimeout(360_000);
    secondPrompt = `P03-${runId}: Nenne in einem kurzen Satz eine typische Rückfrage bei einem Wohnsitzwechsel.`;
    await restorePrimarySession(page);
    const secondResult = await sendAndWaitForAnswer(page, secondPrompt);
    secondConversationId = secondResult.conversationId;
    secondReplyEvidence = secondResult.replyEvidence;
    expect(secondConversationId).not.toBe(firstConversationId);

    await expectStoredConversation(page, firstConversationId, firstPrompt, firstReplyEvidence);
    await expectStoredConversation(page, secondConversationId, secondPrompt, secondReplyEvidence);

    await restartMongoAndApi();
    await restorePrimarySession(page);
    await expectStoredConversation(page, firstConversationId, firstPrompt, firstReplyEvidence);
    await expectStoredConversation(page, secondConversationId, secondPrompt, secondReplyEvidence);
  });

  test('P03 Ergänzung: Umbenennen, Anpinnen, Lösen, Archivieren, Wiederherstellen und Löschen', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const renamedTitle = `TING Verlauf ${runId}`;
    await restorePrimarySession(page);
    await expectStoredConversation(page, secondConversationId, secondPrompt, secondReplyEvidence);

    await openConversationMenu(page, secondConversationId);
    await page.getByRole('menuitem', { name: 'Umbenennen', exact: true }).click();
    const titleInput = page.getByRole('textbox', { name: 'Neuer Titel des Chats', exact: true });
    await titleInput.fill(renamedTitle);
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(page.getByRole('button', { name: `${renamedTitle} Konversation` })).toBeVisible();

    await openConversationMenu(page, secondConversationId);
    await page.getByRole('menuitem', { name: 'Anpinnen', exact: true }).click();
    await expect(page.getByTestId('convo-unpin-button')).toBeVisible();

    await openConversationMenu(page, secondConversationId);
    await page.getByRole('menuitem', { name: 'Loslösen', exact: true }).click();
    await expect(page.getByTestId('convo-unpin-button')).toHaveCount(0);

    await openConversationMenu(page, secondConversationId);
    await page.getByRole('menuitem', { name: 'Archivieren', exact: true }).click();
    await expect(page).toHaveURL(/\/c\/new$/);
    await expect(page.getByRole('button', { name: `${renamedTitle} Konversation` })).toHaveCount(0);

    await page.getByTestId('nav-user').click();
    await page.getByRole('menuitem', { name: 'Archivierte Vorgänge', exact: true }).click();
    const archiveDialog = page.getByRole('dialog', { name: 'Archivierte Vorgänge' });
    await expect(archiveDialog.getByText(renamedTitle, { exact: true })).toBeVisible();
    await archiveDialog.getByRole('button', { name: 'Unterhaltung dearchivieren' }).click();
    await expect(archiveDialog.getByText(renamedTitle, { exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Archivierte Vorgänge' })).toHaveCount(0);
    const restoredLink = page.getByRole('button', { name: `${renamedTitle} Konversation` });
    await expect(restoredLink).toBeVisible();
    const restoredRow = restoredLink.locator('xpath=ancestor::*[@data-testid="convo-item"]');

    await openConversationMenu(page, secondConversationId, restoredRow);
    await page.getByRole('menuitem', { name: 'Löschen', exact: true }).click();
    const deleteDialog = page.getByRole('dialog', { name: 'Chat löschen?' });
    await deleteDialog.getByRole('button', { name: 'Löschen', exact: true }).click();
    await expect(page.getByRole('button', { name: `${renamedTitle} Konversation` })).toHaveCount(0);
    await expect(page).toHaveURL(/\/c\/new$/);
  });

  test('P04: eindeutiger Nachrichtentext wird im echten Suchindex gefunden', async ({ page }) => {
    test.setTimeout(180_000);
    await restorePrimarySession(page);
    const search = page.getByRole('textbox', { name: 'Vorgänge durchsuchen' });
    const searchResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === '/api/convos' &&
        url.searchParams.get('search') === firstSearchToken &&
        response.request().method() === 'GET'
      );
    });
    await search.fill(firstSearchToken);
    const response = await searchResponse;
    expect(response.ok()).toBe(true);
    const searchPayload = (await response.json()) as ConversationSearchResponse;
    expect(
      searchPayload.conversations?.map((conversation) => conversation.conversationId),
    ).toContain(firstConversationId);

    const searchResults = page.getByTestId('convo-item');
    await expect(searchResults).toHaveCount(1, { timeout: 60_000 });
    await searchResults.first().click();
    await expect(page).toHaveURL(new RegExp(`/c/${firstConversationId}$`));
    await expect(messages(page).getByText(firstPrompt, { exact: true })).toBeVisible();
  });

  test('P05: zweites Konto sieht weder URL noch Suchtreffer des ersten Kontos', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await restorePrimarySession(page);
    await expectStoredConversation(page, firstConversationId, firstPrompt, firstReplyEvidence);
    await logout(page);

    await login(page, users[1]);
    await page.goto(`/c/${firstConversationId}`);
    await expect(page.getByRole('textbox', { name: 'Nachrichteneingabe' })).toBeVisible();
    await expect(messages(page).getByText(firstPrompt, { exact: true })).toHaveCount(0);

    const search = page.getByRole('textbox', { name: 'Vorgänge durchsuchen' });
    const searchResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === '/api/convos' &&
        url.searchParams.get('search') === firstSearchToken &&
        response.request().method() === 'GET'
      );
    });
    await search.fill(firstSearchToken);
    const response = await searchResponse;
    expect(response.ok()).toBe(true);
    const searchPayload = (await response.json()) as ConversationSearchResponse;
    expect(searchPayload.conversations ?? []).toHaveLength(0);
    await expect(page.getByText('Keine Vorgänge gefunden', { exact: true })).toBeVisible();
    await expect(page.getByTestId('convo-item')).toHaveCount(0);

    await logout(page);
    await login(page, users[0]);
    primarySessionCookies = await page.context().cookies();
  });

  test('P06: Stop beendet eine lange Antwort und Hochscrollen deaktiviert das Folgen', async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await restorePrimarySession(page);
    await expectStoredConversation(page, firstConversationId, firstPrompt, firstReplyEvidence);

    const composer = page.getByRole('textbox', { name: 'Nachrichteneingabe' });
    const stop = page.getByRole('button', { name: 'Antwort stoppen', exact: true });
    await composer.fill(
      `P06-${runId}: Erstelle eine nummerierte Checkliste mit genau 120 kurzen, unterschiedlichen Punkten zur Vorbereitung eines Behördentermins. Schreibe jeden Punkt in eine eigene Zeile und beginne sofort mit Punkt 1.`,
    );
    await page.getByRole('button', { name: 'An TING senden', exact: true }).click();
    await expect(stop).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2_000);
    await expect(assistantBodies(page).last().locator('.message-content').first()).toContainText(
      /\S/,
    );
    await stop.click();
    await expect(stop).toHaveCount(0, { timeout: 30_000 });
    await expect(assistantBodies(page).last().locator('.message-content').first()).toContainText(
      /\S/,
    );
    await expect(page.getByTestId('send-button')).toBeVisible({ timeout: 30_000 });

    await composer.fill(
      `P06-Scroll-${runId}: Erstelle erneut eine nummerierte Checkliste mit genau 120 kurzen, unterschiedlichen Punkten zur Vorbereitung eines Behördentermins. Schreibe jeden Punkt in eine eigene Zeile und beginne sofort mit Punkt 1.`,
    );
    await page.getByRole('button', { name: 'An TING senden', exact: true }).click();
    await expect(stop).toBeVisible({ timeout: 30_000 });

    const scrollSurface = page.locator('.ting-messages').locator('..');
    await expect
      .poll(
        () => scrollSurface.evaluate((element) => element.scrollHeight - element.clientHeight),
        { timeout: 30_000 },
      )
      .toBeGreaterThan(200);
    await scrollSurface.hover();
    await page.mouse.wheel(0, -1_000);
    await expect
      .poll(() =>
        scrollSurface.evaluate(
          (element) => element.scrollHeight - element.scrollTop - element.clientHeight,
        ),
      )
      .toBeGreaterThan(100);
    await page.waitForTimeout(1_000);
    await expect
      .poll(() =>
        scrollSurface.evaluate(
          (element) => element.scrollHeight - element.scrollTop - element.clientHeight,
        ),
      )
      .toBeGreaterThan(100);
    await stop.click();
    await expect(stop).toHaveCount(0, { timeout: 30_000 });
  });

  test('P07: echter Provider-Netzwerkfehler bleibt sichtbar und derselbe Vorgang ist wiederholbar', async ({
    page,
  }) => {
    test.setTimeout(300_000);
    const failedPrompt = `P07-${runId}: Antworte in einem kurzen Satz.`;
    await restorePrimarySession(page);
    await induceProviderNetworkFailure();

    let failedConversationId = '';
    try {
      const providerResponse = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' && response.url().includes('/api/agents/chat/'),
        { timeout: 60_000 },
      );
      const composer = page.getByRole('textbox', { name: 'Nachrichteneingabe' });
      await composer.fill(failedPrompt);
      await page.getByRole('button', { name: 'An TING senden', exact: true }).click();
      await providerResponse;
      failedConversationId = await currentConversationId(page);
      await expect(assistantBodies(page).last().getByRole('alert')).toBeVisible({
        timeout: 90_000,
      });
      await expect(composer).toBeEnabled();
    } finally {
      await recreateApi();
    }

    const retry = page.getByTestId('regenerate-generation-button');
    await expect(retry).toBeVisible();
    const retryResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && response.url().includes('/api/agents/chat/'),
      { timeout: 120_000 },
    );
    await retry.click();
    expect((await retryResponse).ok()).toBe(true);
    await expect(assistantBodies(page).last().locator('.message-content').first()).toContainText(
      /\S/,
      {
        timeout: 120_000,
      },
    );
    await expect(assistantBodies(page).last().getByRole('alert')).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/c/${failedConversationId}$`));
    await expect(messages(page).getByText(failedPrompt, { exact: true })).toHaveCount(1);
    await expect(page.locator(`#conversation-menu-${failedConversationId}`)).toHaveCount(1);
  });

  test('P08: ohne Provider bleiben Anmeldung und gespeicherter Verlauf verfügbar', async ({
    page,
  }) => {
    test.setTimeout(300_000);
    if (!providerSnapshot) {
      throw new Error('Provider-Konfiguration wurde nicht geladen.');
    }

    await withProviderValues('', '', async () => {
      await restorePrimarySession(page);
      expect(await chatCapability(page)).toBe('not_configured');
      await expectStoredConversation(page, firstConversationId, firstPrompt, firstReplyEvidence);

      const draft = `P08-${runId}: Dieser Entwurf muss erhalten bleiben.`;
      const composer = page.getByRole('textbox', { name: 'Nachrichteneingabe' });
      await composer.fill(draft);
      await page.getByRole('button', { name: 'An TING senden', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText(
        'TING kann gerade nicht antworten. Bitte versuchen Sie es später erneut.',
      );
      await expect(composer).toHaveValue(draft);
      await expect(page).toHaveURL(new RegExp(`/c/${firstConversationId}$`));
      await expect(messages(page).getByText(firstPrompt, { exact: true })).toBeVisible();
    });
  });
});
