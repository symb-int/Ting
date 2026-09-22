import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PrincipalType, SystemRoles } from 'librechat-data-provider';
import type { TingProcedureCreateInput, TingProcedureUpdateInput } from 'librechat-data-provider';
import { runAsSystem, tenantStorage } from '../config/tenantContext';
import { createTingProcedureModel } from '../models/tingProcedure';
import { createSystemGrantModel } from '../models/systemGrant';
import { createTingProcedureMethods } from './tingProcedure';
import { SystemCapabilities } from '../admin/capabilities';
import { createSystemGrantMethods } from './systemGrant';

let mongo: MongoMemoryServer;
let methods: ReturnType<typeof createTingProcedureMethods>;
const actor = 'operator-a';
const input = (overrides: Partial<TingProcedureCreateInput> = {}): TingProcedureCreateInput => ({
  title: 'Example procedure',
  description: 'Help with a defined concern.',
  intent: 'save',
  requestId: randomUUID(),
  ...overrides,
});
const asTenant = <T>(tenantId: string | undefined, operation: () => Promise<T>) =>
  tenantStorage.run({ tenantId }, operation);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { args: ['--nounixsocket'] } });
  await mongoose.connect(mongo.getUri());
  await createTingProcedureModel(mongoose).init();
  await createSystemGrantModel(mongoose).init();
  methods = createTingProcedureMethods(mongoose);
});

beforeEach(async () => {
  await runAsSystem(async () => {
    await mongoose.models.TingProcedure.deleteMany({});
    await mongoose.models.SystemGrant.deleteMany({});
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

test('starts empty; draft remains private and a publication is an immutable catalog snapshot', async () => {
  expect(await methods.listPublishedTingProcedures()).toEqual([]);
  const draft = await methods.createTingProcedure(
    actor,
    input({ title: '  Example  ', description: '' }),
  );
  expect(draft.draft).toEqual({ title: 'Example', description: '' });
  expect(await methods.listPublishedTingProcedures()).toEqual([]);
  const published = await methods.updateTingProcedure(actor, draft.procedureId, {
    ...input({ title: draft.draft.title, intent: 'publish' }),
    expectedEditRevision: draft.editRevision,
  });
  const snapshot = (await methods.listPublishedTingProcedures())[0];
  expect(snapshot).toEqual({
    procedureId: draft.procedureId,
    revisionId: published.published?.revisionId,
    version: 1,
    title: 'Example',
    description: 'Help with a defined concern.',
  });
  const changed = await methods.updateTingProcedure(actor, draft.procedureId, {
    ...input({ title: 'Changed draft' }),
    expectedEditRevision: published.editRevision,
  });
  expect(changed.published).toEqual(published.published);
  expect(await methods.listPublishedTingProcedures()).toEqual([snapshot]);
  expect(Object.keys(changed)).not.toEqual(
    expect.arrayContaining(['createRequestId', 'createPayloadHash', 'lastMutation', 'tenantId']),
  );
});

test('deduplicates concurrent creation with a real unique index and rejects changed payload replay', async () => {
  const request = input({ intent: 'publish' });
  const results = await Promise.all(
    Array.from({ length: 5 }, () => methods.createTingProcedure(actor, request)),
  );
  expect(new Set(results.map((record) => record.procedureId)).size).toBe(1);
  expect(await mongoose.models.TingProcedure.countDocuments({})).toBe(1);
  await expect(
    methods.createTingProcedure(actor, { ...request, title: 'Different' }),
  ).rejects.toMatchObject({ code: 'conflict' });
});

test('publication retries and unchanged inputs never produce extra versions or revisions', async () => {
  const initial = await methods.createTingProcedure(actor, input());
  const request: TingProcedureUpdateInput = {
    ...input({ intent: 'publish' }),
    expectedEditRevision: initial.editRevision,
  };
  const results = await Promise.all([
    methods.updateTingProcedure(actor, initial.procedureId, request),
    methods.updateTingProcedure(actor, initial.procedureId, request),
  ]);
  expect(results[0]).toEqual(results[1]);
  expect(results[0].published?.version).toBe(1);
  const noChange = await methods.updateTingProcedure(actor, initial.procedureId, {
    ...request,
    requestId: randomUUID(),
    expectedEditRevision: results[0].editRevision,
  });
  expect(noChange).toEqual(results[0]);
  await expect(
    methods.updateTingProcedure(actor, initial.procedureId, { ...request, title: 'Different' }),
  ).rejects.toMatchObject({ code: 'conflict' });
});

test('exactly one concurrent editor succeeds and old requests cannot roll back later content', async () => {
  const initial = await methods.createTingProcedure(actor, input({ intent: 'publish' }));
  const first = {
    ...input({ title: 'First edit', intent: 'publish' }),
    expectedEditRevision: initial.editRevision,
  };
  const second = {
    ...input({ title: 'Second edit', intent: 'publish' }),
    expectedEditRevision: initial.editRevision,
  };
  const results = await Promise.allSettled([
    methods.updateTingProcedure(actor, initial.procedureId, first),
    methods.updateTingProcedure('operator-b', initial.procedureId, second),
  ]);
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
  const current = await methods.getTingProcedure(initial.procedureId);
  expect(current?.published?.version).toBe(2);
  const newer = await methods.updateTingProcedure(actor, initial.procedureId, {
    ...input({ title: 'Final content' }),
    expectedEditRevision: current!.editRevision,
  });
  await expect(
    methods.updateTingProcedure(actor, initial.procedureId, first),
  ).rejects.toMatchObject({ code: 'conflict' });
  expect(await methods.getTingProcedure(initial.procedureId)).toEqual(newer);
});

test('isolates read, publication, write and dedupe across tenants and a tenantless installation', async () => {
  const request = input({ intent: 'publish' });
  const a = await asTenant('a', () => methods.createTingProcedure(actor, request));
  const b = await asTenant('b', () => methods.createTingProcedure(actor, request));
  const local = await asTenant(undefined, () => methods.createTingProcedure(actor, request));
  expect(new Set([a.procedureId, b.procedureId, local.procedureId]).size).toBe(3);
  expect(await asTenant('b', () => methods.getTingProcedure(a.procedureId))).toBeNull();
  expect(
    await asTenant(undefined, () => methods.getPublishedTingProcedure(a.procedureId)),
  ).toBeNull();
  await expect(
    asTenant('b', () =>
      methods.updateTingProcedure(actor, a.procedureId, {
        ...input(),
        expectedEditRevision: a.editRevision,
      }),
    ),
  ).rejects.toMatchObject({ code: 'not_found' });
  expect(
    (await asTenant('a', () => methods.listPublishedTingProcedures())).map((p) => p.procedureId),
  ).toEqual([a.procedureId]);
  expect(
    (await asTenant(undefined, () => methods.listTingProcedures({ limit: 25 }))).items.map(
      (p) => p.procedureId,
    ),
  ).toEqual([local.procedureId]);
});

test('cursor pagination orders ties deterministically without duplicate or missing records', async () => {
  const records = await Promise.all(
    Array.from({ length: 5 }, () => methods.createTingProcedure(actor, input())),
  );
  await mongoose.models.TingProcedure.updateMany(
    {},
    { $set: { updatedAt: new Date('2026-01-01T00:00:00Z') } },
    { timestamps: false },
  );
  const first = await methods.listTingProcedures({ limit: 2 });
  const second = await methods.listTingProcedures({ limit: 2, cursor: first.nextCursor! });
  const third = await methods.listTingProcedures({ limit: 2, cursor: second.nextCursor! });
  expect([...first.items, ...second.items, ...third.items].map((p) => p.procedureId)).toEqual(
    records.map((p) => p.procedureId).sort(),
  );
  expect(third.nextCursor).toBeNull();
  await expect(methods.listTingProcedures({ limit: 2, cursor: 'invalid' })).rejects.toMatchObject({
    code: 'invalid_cursor',
  });
});

test('validates strict contract at storage boundary too', async () => {
  await expect(methods.createTingProcedure(actor, input({ title: '  ' }))).rejects.toThrow();
  await expect(
    methods.createTingProcedure(actor, input({ intent: 'publish', description: '' })),
  ).rejects.toThrow();
  const invalid = { ...input(), tenantId: 'foreign' };
  await expect(methods.createTingProcedure(actor, invalid)).rejects.toThrow();
});

test('native capability grants are tenant scoped, idempotent and admins receive the new capability', async () => {
  const grants = createSystemGrantMethods(mongoose);
  const principalId = new mongoose.Types.ObjectId().toString();
  const principals = [{ principalType: PrincipalType.USER, principalId }];
  const target = {
    principalType: PrincipalType.USER,
    principalId,
    capability: SystemCapabilities.MANAGE_PROCEDURES,
    tenantId: 'a',
  };
  expect(
    await grants.hasCapabilityForPrincipals({
      principals,
      capability: target.capability,
      tenantId: 'a',
    }),
  ).toBe(false);
  expect((await grants.grantCapability(target)).created).toBe(true);
  expect((await grants.grantCapability(target)).created).toBe(false);
  expect(
    await grants.hasCapabilityForPrincipals({
      principals,
      capability: target.capability,
      tenantId: 'a',
    }),
  ).toBe(true);
  expect(
    await grants.hasCapabilityForPrincipals({
      principals,
      capability: target.capability,
      tenantId: 'b',
    }),
  ).toBe(false);
  expect((await grants.revokeCapability(target)).deletedCount).toBe(1);
  expect((await grants.revokeCapability(target)).deletedCount).toBe(0);
  expect(
    await grants.hasCapabilityForPrincipals({
      principals,
      capability: target.capability,
      tenantId: 'a',
    }),
  ).toBe(false);
  await runAsSystem(() => grants.seedSystemGrants());
  expect(
    await grants.hasCapabilityForPrincipals({
      principals: [{ principalType: PrincipalType.ROLE, principalId: SystemRoles.ADMIN }],
      capability: target.capability,
    }),
  ).toBe(true);
});
