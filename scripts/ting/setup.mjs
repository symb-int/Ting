#!/usr/bin/env node

import dotenv from 'dotenv';
import yaml from 'js-yaml';
import { configSchema } from 'librechat-data-provider';
import { randomBytes as createRandomBytes } from 'node:crypto';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROJECT_ROOT = path.resolve(SCRIPT_DIRECTORY, '../..');
const CONFIG_VERSION = '1.3.16';
const PROMPT_PREFIX =
  'Du bist TING und hilfst dabei, Anliegen im Gespräch zu klären. Antworte auf Deutsch, klar und knapp. Frage nach, wenn nötige Angaben fehlen. Behaupte keine ausgeführten Aktionen, Behördenkontakte oder Erinnerungen ohne bestätigtes Werkzeugergebnis.';

const ENVIRONMENT_DEFAULTS = [
  ['HOST', '0.0.0.0'],
  ['PORT', '3080'],
  ['DOMAIN_CLIENT', 'http://localhost:3090'],
  ['DOMAIN_SERVER', 'http://localhost:3080'],
  ['APP_TITLE', 'TING'],
  ['ENDPOINTS', 'openAI'],
  ['MONGO_URI', 'mongodb://mongodb:27017/LibreChat'],
  ['CONFIG_PATH', '/app/librechat.yaml'],
  ['SEARCH', 'true'],
  ['MEILI_HOST', 'http://meilisearch:7700'],
  ['MEILI_NO_ANALYTICS', 'true'],
  ['USE_REDIS', 'false'],
  ['USE_REDIS_STREAMS', 'false'],
  ['USE_REDIS_CLUSTER', 'false'],
  ['ALLOW_EMAIL_LOGIN', 'true'],
  ['ALLOW_REGISTRATION', 'true'],
  ['ALLOW_SOCIAL_LOGIN', 'false'],
  ['ALLOW_SOCIAL_REGISTRATION', 'false'],
  ['ALLOW_PASSWORD_RESET', 'false'],
  ['ALLOW_UNVERIFIED_EMAIL_LOGIN', 'false'],
  ['SESSION_COOKIE_SECURE', 'false'],
  ['ALLOW_SHARED_LINKS', 'false'],
  ['ALLOW_SHARED_LINKS_PUBLIC', 'false'],
  ['OPENAI_API_KEY', ''],
  ['OPENAI_MODELS', ''],
];

const SECRET_SIZES = [
  ['CREDS_KEY', 32],
  ['CREDS_IV', 16],
  ['JWT_SECRET', 32],
  ['JWT_REFRESH_SECRET', 32],
  ['MEILI_MASTER_KEY', 32],
];

export const RUNTIME_ENVIRONMENT_KEYS = Object.freeze([
  ...SECRET_SIZES.map(([key]) => key),
  ...ENVIRONMENT_DEFAULTS.map(([key]) => key),
]);

function replaceLastEnvironmentDefinition(source, key, value) {
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const hadTrailingNewline = source.endsWith('\n');
  const lines = source.split(/\r?\n/);
  const pattern = new RegExp(`^(\\s*(?:export\\s+)?)${key}(\\s*=).*$`);

  if (hadTrailingNewline) {
    lines.pop();
  }

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const match = lines[index].match(pattern);
    if (!match) {
      continue;
    }
    lines[index] = `${match[1]}${key}${match[2]}${value}`;
    return `${lines.join(newline)}${hadTrailingNewline ? newline : ''}`;
  }

  return source;
}

function appendEnvironmentValues(source, entries) {
  if (entries.length === 0) {
    return source;
  }

  let prefix = '';
  if (source.length > 0) {
    prefix = source.endsWith('\n') ? '\n' : '\n\n';
  }
  const heading =
    source.length === 0 ? '# Lokale TING-Entwicklungsumgebung\n' : '# TING-Konfiguration\n';
  const lines = entries.map(([key, value]) => `${key}=${value}`).join('\n');
  return `${source}${prefix}${heading}${lines}\n`;
}

export function mergeEnvironment(source, randomBytes = createRandomBytes) {
  let result = source;
  let parsed = dotenv.parse(result);
  const missingSecrets = [];

  for (const [key, size] of SECRET_SIZES) {
    if (parsed[key]?.trim()) {
      continue;
    }

    const secret = randomBytes(size).toString('hex');
    if (Object.hasOwn(parsed, key)) {
      result = replaceLastEnvironmentDefinition(result, key, secret);
    } else {
      missingSecrets.push([key, secret]);
    }
    parsed = dotenv.parse(result);
  }

  result = appendEnvironmentValues(result, missingSecrets);
  parsed = dotenv.parse(result);
  const missingDefaults = ENVIRONMENT_DEFAULTS.filter(([key]) => !Object.hasOwn(parsed, key));
  result = appendEnvironmentValues(result, missingDefaults);
  return result;
}

function getSingleOpenAIModel(environment) {
  const models = (environment.OPENAI_MODELS ?? '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  if (!(environment.OPENAI_API_KEY ?? '').trim() || models.length !== 1) {
    return undefined;
  }

  return models[0];
}

export function createLibreChatConfig(environment) {
  const config = {
    version: CONFIG_VERSION,
    cache: true,
    interface: {
      modelSelect: false,
      parameters: false,
      presets: false,
      prompts: false,
      bookmarks: false,
      multiConvo: false,
      agents: false,
      temporaryChat: false,
      autoSubmitFromUrl: false,
      runCode: false,
      webSearch: false,
      contextUsage: false,
      contextCost: false,
      feedback: false,
      peoplePicker: {
        users: false,
        groups: false,
        roles: false,
      },
      marketplace: {
        use: false,
      },
      mcpServers: {
        use: false,
        create: false,
        share: false,
        public: false,
      },
      fileSearch: false,
      fileCitations: false,
      defaultPinnedTools: [],
      buildInfo: false,
      remoteAgents: {
        use: false,
        create: false,
        share: false,
        public: false,
      },
      skills: false,
      sharedLinks: false,
      schedules: false,
    },
    speech: {
      speechTab: {
        conversationMode: false,
        advancedMode: false,
        speechToText: false,
        textToSpeech: false,
      },
    },
    fileConfig: {
      endpoints: {
        default: {
          disabled: true,
        },
        agents: {
          disabled: true,
        },
        openAI: {
          disabled: true,
        },
      },
    },
  };

  const model = getSingleOpenAIModel(environment);
  if (!model) {
    return config;
  }

  return {
    ...config,
    endpoints: {
      openAI: {
        titleModel: 'current_model',
      },
    },
    modelSpecs: {
      enforce: true,
      prioritize: true,
      list: [
        {
          name: 'ting-chat',
          label: 'TING',
          default: true,
          preset: {
            endpoint: 'openAI',
            model,
            modelLabel: 'TING',
            promptPrefix: PROMPT_PREFIX,
          },
        },
      ],
    },
  };
}

export function serializeLibreChatConfig(config) {
  configSchema.parse(config);
  return yaml.dump(config, {
    forceQuotes: false,
    lineWidth: -1,
    noRefs: true,
    quotingType: "'",
  });
}

async function readOptionalFile(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
}

export async function runSetup({
  projectRoot = DEFAULT_PROJECT_ROOT,
  randomBytes = createRandomBytes,
  logger = console,
} = {}) {
  const environmentPath = path.join(projectRoot, '.env');
  const configPath = path.join(projectRoot, 'librechat.yaml');
  const currentEnvironment = await readOptionalFile(environmentPath);
  const nextEnvironment = mergeEnvironment(currentEnvironment, randomBytes);

  await mkdir(projectRoot, { recursive: true });
  if (nextEnvironment !== currentEnvironment) {
    await writeFile(environmentPath, nextEnvironment, { mode: 0o600 });
  }
  await chmod(environmentPath, 0o600);

  const environment = dotenv.parse(nextEnvironment);
  const config = createLibreChatConfig(environment);
  const serializedConfig = serializeLibreChatConfig(config);
  const currentConfig = await readOptionalFile(configPath);
  if (serializedConfig !== currentConfig) {
    await writeFile(configPath, serializedConfig, { mode: 0o644 });
  }

  const providerConfigured = config.modelSpecs != null;
  logger.log('TING-Konfiguration ist eingerichtet.');
  logger.log(
    providerConfigured
      ? 'Der OpenAI-Modellzugang ist konfiguriert.'
      : 'Der Modellzugang ist nicht konfiguriert; die App bleibt lokal nutzbar.',
  );

  return {
    config,
    configPath,
    environment,
    environmentPath,
    providerConfigured,
  };
}

const isDirectExecution =
  process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  runSetup().catch((error) => {
    console.error(`TING-Setup fehlgeschlagen: ${error.message}`);
    process.exitCode = 1;
  });
}
