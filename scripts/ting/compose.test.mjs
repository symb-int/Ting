import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import yaml from 'js-yaml';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('TING Compose stack', () => {
  it('uses the pinned source build and only the required services', async () => {
    const compose = yaml.load(await readFile(path.join(PROJECT_ROOT, 'compose.ting.yaml'), 'utf8'));

    assert.deepEqual(Object.keys(compose.services).sort(), ['api', 'meilisearch', 'mongodb']);
    assert.equal(compose.services.api.build.dockerfile, 'Dockerfile.multi');
    assert.equal(compose.services.api.build.target, 'api-build');
    assert.equal(compose.services.mongodb.image, 'mongo:8.0.20');
    assert.equal(compose.services.meilisearch.image, 'getmeili/meilisearch:v1.35.1');
    assert.deepEqual(compose.services.api.ports, ['127.0.0.1:3080:3080']);
    assert.ok(compose.services.api.command.at(-1).includes('runtime-config.mjs'));
    assert.equal(
      compose.services.api.volumes.some((volume) => volume.type === 'bind'),
      false,
    );
    assert.equal(compose.services.mongodb.ports, undefined);
    assert.equal(compose.services.meilisearch.ports, undefined);
  });

  it('persists service data and health-checks every required service', async () => {
    const compose = yaml.load(await readFile(path.join(PROJECT_ROOT, 'compose.ting.yaml'), 'utf8'));
    const apiDataVolume = compose.services.api.volumes.find(
      (volume) => volume.target === '/app/data',
    );
    const profileImageVolume = compose.services.api.volumes.find(
      (volume) => volume.target === '/app/client/public/images',
    );
    const mongoDataVolume = compose.services.mongodb.volumes.find(
      (volume) => volume.target === '/data/db',
    );
    const meiliDataVolume = compose.services.meilisearch.volumes.find(
      (volume) => volume.target === '/meili_data',
    );

    assert.equal(apiDataVolume.type, 'volume');
    assert.equal(profileImageVolume.type, 'volume');
    assert.equal(mongoDataVolume.type, 'volume');
    assert.equal(meiliDataVolume.type, 'volume');
    assert.ok(compose.services.api.healthcheck.test.includes('http://localhost:3080/health'));
    assert.ok(compose.services.mongodb.healthcheck.test.includes('mongosh'));
    assert.ok(
      compose.services.meilisearch.healthcheck.test.includes('http://localhost:7700/health'),
    );
    assert.equal(compose.services.api.depends_on.mongodb.condition, 'service_healthy');
    assert.equal(compose.services.api.depends_on.meilisearch.condition, 'service_healthy');
  });
});
