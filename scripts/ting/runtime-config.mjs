#!/usr/bin/env node

import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  RUNTIME_ENVIRONMENT_KEYS,
  createLibreChatConfig,
  serializeLibreChatConfig,
} from './setup.mjs';

const DEFAULT_APP_ROOT = '/app';

function serializeEnvironment(environment) {
  return `${RUNTIME_ENVIRONMENT_KEYS.map((key) => {
    const value = environment[key] ?? '';
    return `${key}=${JSON.stringify(value)}`;
  }).join('\n')}\n`;
}

export async function writeRuntimeConfig({
  appRoot = DEFAULT_APP_ROOT,
  environment = process.env,
} = {}) {
  const environmentPath = path.join(appRoot, '.env');
  const configPath = path.join(appRoot, 'librechat.yaml');

  await mkdir(appRoot, { recursive: true });
  await writeFile(environmentPath, serializeEnvironment(environment), { mode: 0o600 });
  await chmod(environmentPath, 0o600);
  await writeFile(configPath, serializeLibreChatConfig(createLibreChatConfig(environment)), {
    mode: 0o644,
  });

  return { configPath, environmentPath };
}

const isDirectExecution =
  process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  writeRuntimeConfig().catch((error) => {
    console.error(`TING-Laufzeitkonfiguration fehlgeschlagen: ${error.message}`);
    process.exitCode = 1;
  });
}
