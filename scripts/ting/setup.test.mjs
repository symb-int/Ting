import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';

import yaml from 'js-yaml';

import { createLibreChatConfig, mergeEnvironment, runSetup } from './setup.mjs';
import { writeRuntimeConfig } from './runtime-config.mjs';

const temporaryDirectories = [];
const silentLogger = { log() {} };

function deterministicRandomBytes(size) {
  return Buffer.alloc(size, 0x5a);
}

async function createTemporaryProject() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'ting-setup-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('TING setup', () => {
  it('creates the required local environment and a provider-free config', async () => {
    const projectRoot = await createTemporaryProject();
    const result = await runSetup({
      logger: silentLogger,
      projectRoot,
      randomBytes: deterministicRandomBytes,
    });

    const environmentFile = await readFile(path.join(projectRoot, '.env'), 'utf8');
    const config = yaml.load(await readFile(path.join(projectRoot, 'librechat.yaml'), 'utf8'));

    assert.equal(result.providerConfigured, false);
    assert.equal(result.environment.APP_TITLE, 'TING');
    assert.equal(result.environment.DOMAIN_CLIENT, 'http://localhost:3090');
    assert.equal(result.environment.DOMAIN_SERVER, 'http://localhost:3080');
    assert.equal(result.environment.MONGO_URI, 'mongodb://mongodb:27017/LibreChat');
    assert.equal(result.environment.MEILI_HOST, 'http://meilisearch:7700');
    assert.equal(result.environment.OPENAI_API_KEY, '');
    assert.equal(result.environment.OPENAI_MODELS, '');
    assert.match(result.environment.CREDS_KEY, /^[a-f0-9]{64}$/);
    assert.match(result.environment.CREDS_IV, /^[a-f0-9]{32}$/);
    assert.match(result.environment.JWT_SECRET, /^[a-f0-9]{64}$/);
    assert.match(result.environment.JWT_REFRESH_SECRET, /^[a-f0-9]{64}$/);
    assert.match(result.environment.MEILI_MASTER_KEY, /^[a-f0-9]{64}$/);
    assert.ok(environmentFile.endsWith('\n'));
    assert.equal(config.version, '1.3.16');
    assert.equal(config.interface.modelSelect, false);
    assert.equal(config.fileConfig.endpoints.default.disabled, true);
    assert.equal(config.modelSpecs, undefined);
    assert.equal(config.endpoints, undefined);
    assert.equal(config.ting.matcher.implementation, 'llm');
    assert.equal(config.ting.model.timeoutMs, 60_000);
    assert.equal(config.ting.procedures.pageSize, 25);
  });

  it('is byte-stable on repetition and preserves existing values', async () => {
    const projectRoot = await createTemporaryProject();
    const existingSecret = 'existing-jwt-secret-with-more-than-thirty-two-bytes';
    await writeFile(
      path.join(projectRoot, '.env'),
      `CUSTOM_VALUE=behalten\nJWT_SECRET=${existingSecret}\nOPENAI_API_KEY=existing-provider-key\nOPENAI_MODELS=\n`,
    );

    await runSetup({
      logger: silentLogger,
      projectRoot,
      randomBytes: deterministicRandomBytes,
    });
    const firstEnvironment = await readFile(path.join(projectRoot, '.env'), 'utf8');
    const firstConfig = await readFile(path.join(projectRoot, 'librechat.yaml'), 'utf8');

    await runSetup({
      logger: silentLogger,
      projectRoot,
      randomBytes() {
        throw new Error('No secret may be regenerated on the second run.');
      },
    });

    assert.equal(await readFile(path.join(projectRoot, '.env'), 'utf8'), firstEnvironment);
    assert.equal(await readFile(path.join(projectRoot, 'librechat.yaml'), 'utf8'), firstConfig);
    assert.match(firstEnvironment, /CUSTOM_VALUE=behalten/);
    assert.match(firstEnvironment, new RegExp(`JWT_SECRET=${existingSecret}`));
    assert.match(firstEnvironment, /OPENAI_API_KEY=existing-provider-key/);
  });

  it('fills empty required secrets without replacing non-empty secrets', () => {
    const source = 'CREDS_KEY=\nJWT_SECRET=already-set\n';
    const result = mergeEnvironment(source, deterministicRandomBytes);

    assert.match(result, /CREDS_KEY=(?:5a){32}/);
    assert.match(result, /JWT_SECRET=already-set/);
  });

  it('configures exactly one OpenAI model only when both inputs are complete', () => {
    const configured = createLibreChatConfig({
      OPENAI_API_KEY: 'provider-key',
      OPENAI_MODELS: 'gpt-5.1-mini',
    });

    assert.deepEqual(configured.endpoints, {
      openAI: { titleModel: 'current_model' },
    });
    assert.deepEqual(configured.modelSpecs, {
      enforce: true,
      prioritize: true,
      list: [
        {
          name: 'ting-chat',
          label: 'TING',
          default: true,
          preset: {
            endpoint: 'openAI',
            model: 'gpt-5.1-mini',
            modelLabel: 'TING',
            promptPrefix:
              'Du bist TING und hilfst dabei, Anliegen im Gespräch zu klären. Antworte auf Deutsch, klar und knapp. Frage nach, wenn nötige Angaben fehlen. Behaupte keine ausgeführten Aktionen, Behördenkontakte oder Erinnerungen ohne bestätigtes Werkzeugergebnis.',
          },
        },
      ],
    });

    for (const environment of [
      { OPENAI_API_KEY: '', OPENAI_MODELS: '' },
      { OPENAI_API_KEY: 'provider-key', OPENAI_MODELS: '' },
      { OPENAI_API_KEY: '', OPENAI_MODELS: 'gpt-5.1-mini' },
      { OPENAI_API_KEY: 'provider-key', OPENAI_MODELS: 'model-a,model-b' },
    ]) {
      const unconfigured = createLibreChatConfig(environment);
      assert.equal(unconfigured.modelSpecs, undefined);
      assert.equal(unconfigured.endpoints, undefined);
    }
  });

  it('preserves the selected matcher independently of provider availability', () => {
    const config = createLibreChatConfig({ TING_MATCHER_IMPLEMENTATION: 'future-adapter' });
    assert.equal(config.ting.matcher.implementation, 'future-adapter');
    assert.equal(config.modelSpecs, undefined);
  });

  it('materializes the same private environment and derived config inside the container', async () => {
    const appRoot = await createTemporaryProject();
    const environment = Object.fromEntries(
      mergeEnvironment('', deterministicRandomBytes)
        .trim()
        .split('\n')
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const separator = line.indexOf('=');
          return [line.slice(0, separator), line.slice(separator + 1)];
        }),
    );
    environment.OPENAI_API_KEY = 'provider-key';
    environment.OPENAI_MODELS = 'gpt-test';

    await writeRuntimeConfig({ appRoot, environment });

    const runtimeEnvironment = await readFile(path.join(appRoot, '.env'), 'utf8');
    const runtimeConfig = yaml.load(await readFile(path.join(appRoot, 'librechat.yaml'), 'utf8'));
    const environmentMode = (await stat(path.join(appRoot, '.env'))).mode & 0o777;

    assert.equal(environmentMode, 0o600);
    assert.match(runtimeEnvironment, /^OPENAI_API_KEY="provider-key"$/m);
    assert.equal(runtimeConfig.modelSpecs.list[0].preset.model, 'gpt-test');
    assert.equal(
      runtimeConfig.modelSpecs.list[0].preset.promptPrefix.includes('Du bist TING'),
      true,
    );
  });
});
