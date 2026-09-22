/** Isolated integration server: production application, disposable real MongoDB, no model stub. */
const fs = require('node:fs/promises');
const path = require('node:path');
const { MongoMemoryServer } = require('mongodb-memory-server');

let database;

async function start() {
  const { runSetup } = await import('../../scripts/ting/setup.mjs');
  const directory = path.resolve(__dirname, '../.generated/ting');
  const { environment } = await runSetup({ projectRoot: directory, logger: { log() {} } });
  database = await MongoMemoryServer.create({
    instance: { dbName: 'TING-I02-e2e', args: ['--nounixsocket'] },
  });
  const baseURL = process.env.TING_BASE_URL || 'http://localhost:3097';
  Object.assign(process.env, environment, {
    NODE_ENV: 'test',
    HOST: '0.0.0.0',
    PORT: new URL(baseURL).port || '3097',
    DOMAIN_CLIENT: baseURL,
    DOMAIN_SERVER: baseURL,
    MONGO_URI: database.getUri(),
    CONFIG_PATH: path.join(directory, 'librechat.yaml'),
    SEARCH: 'false',
    DEBUG_LOGGING: 'false',
    CONSOLE_JSON: 'false',
    OPENAI_API_KEY: '',
    OPENAI_MODELS: '',
    LIBRECHAT_TEST_RUN_HOOK: '',
  });
  await fs.writeFile(
    path.join(directory, 'runtime-env.json'),
    JSON.stringify({ MONGO_URI: process.env.MONGO_URI }),
    { mode: 0o600 },
  );
  require('../../api/server/index.js');
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await database?.stop();
    process.exit(0);
  });
}

start().catch(async (error) => {
  console.error('[ting-e2e] Server start failed:', error);
  await database?.stop();
  process.exit(1);
});
