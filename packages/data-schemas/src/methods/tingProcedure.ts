import { z } from 'zod';
import { createHash, randomUUID } from 'node:crypto';
import { tingProcedureCreateSchema, tingProcedureUpdateSchema } from 'librechat-data-provider';
import type {
  TingProcedureDto,
  TingProcedureCreateInput,
  TingProcedureUpdateInput,
  TingCatalogEntry,
} from 'librechat-data-provider';
import type { Model, FilterQuery } from 'mongoose';
import type { TingProcedureRecord } from '~/schema/tingProcedure';
import { getTenantId, SYSTEM_TENANT_ID } from '~/config/tenantContext';

export class TingProcedureError extends Error {
  constructor(
    public readonly code: 'conflict' | 'not_found' | 'invalid_cursor',
    message: string,
  ) {
    super(message);
    this.name = 'TingProcedureError';
  }
}

const cursorSchema = z
  .object({ updatedAt: z.string().datetime(), procedureId: z.string().uuid() })
  .strict();

function scope(): FilterQuery<TingProcedureRecord> {
  const tenantId = getTenantId();
  if (tenantId === SYSTEM_TENANT_ID) {
    throw new Error('Procedure operations require an account tenant context');
  }
  /** An installation without tenants must never gain visibility of tenant-scoped rows. */
  return { tenantId: tenantId ?? { $exists: false } };
}

function hash(input: TingProcedureCreateInput | TingProcedureUpdateInput): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        title: input.title,
        description: input.description,
        intent: input.intent,
        ...('expectedEditRevision' in input
          ? { expectedEditRevision: input.expectedEditRevision }
          : {}),
      }),
    )
    .digest('hex');
}

function dto(record: TingProcedureRecord): TingProcedureDto {
  return {
    procedureId: record.procedureId,
    draft: { title: record.draft.title, description: record.draft.description },
    published: record.published
      ? {
          title: record.published.title,
          description: record.published.description,
          revisionId: record.published.revisionId,
          version: record.published.version,
          publishedAt: record.published.publishedAt.toISOString(),
          publishedBy: record.published.publishedBy,
        }
      : null,
    editRevision: record.editRevision,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
  };
}

function catalogEntry(record: TingProcedureRecord): TingCatalogEntry {
  const published = record.published;
  if (!published) {
    throw new Error('A published procedure is required');
  }
  return {
    procedureId: record.procedureId,
    revisionId: published.revisionId,
    version: published.version,
    title: published.title,
    description: published.description,
  };
}

export interface TingProcedureMethods {
  getTingProcedure(procedureId: string): Promise<TingProcedureDto | null>;
  listTingProcedures(options: {
    limit: number;
    cursor?: string;
  }): Promise<{ items: TingProcedureDto[]; nextCursor: string | null }>;
  listPublishedTingProcedures(): Promise<TingCatalogEntry[]>;
  getPublishedTingProcedure(
    procedureId: string,
    revisionId?: string,
  ): Promise<TingCatalogEntry | null>;
  createTingProcedure(actorId: string, input: TingProcedureCreateInput): Promise<TingProcedureDto>;
  updateTingProcedure(
    actorId: string,
    procedureId: string,
    input: TingProcedureUpdateInput,
  ): Promise<TingProcedureDto>;
}

export function createTingProcedureMethods(
  mongoose: typeof import('mongoose'),
): TingProcedureMethods {
  const model = () => mongoose.models.TingProcedure as Model<TingProcedureRecord>;

  async function getTingProcedure(procedureId: string): Promise<TingProcedureDto | null> {
    const record = await model()
      .findOne({ ...scope(), procedureId })
      .lean<TingProcedureRecord>();
    return record ? dto(record) : null;
  }

  async function listTingProcedures(options: {
    limit: number;
    cursor?: string;
  }): Promise<{ items: TingProcedureDto[]; nextCursor: string | null }> {
    if (!Number.isSafeInteger(options.limit) || options.limit < 1) {
      throw new Error('A positive procedure page size is required');
    }
    const filter = scope();
    if (options.cursor) {
      try {
        const cursor = cursorSchema.parse(
          JSON.parse(Buffer.from(options.cursor, 'base64url').toString('utf8')),
        );
        filter.$or = [
          { updatedAt: { $lt: new Date(cursor.updatedAt) } },
          { updatedAt: new Date(cursor.updatedAt), procedureId: { $gt: cursor.procedureId } },
        ];
      } catch {
        throw new TingProcedureError(
          'invalid_cursor',
          'Die nächste Seite konnte nicht bestimmt werden.',
        );
      }
    }
    const records = await model()
      .find(filter)
      .sort({ updatedAt: -1, procedureId: 1 })
      .limit(options.limit + 1)
      .lean<TingProcedureRecord[]>();
    const more = records.length > options.limit;
    const page = records.slice(0, options.limit);
    const last = page[page.length - 1];
    return {
      items: page.map(dto),
      nextCursor:
        more && last
          ? Buffer.from(
              JSON.stringify({
                updatedAt: last.updatedAt.toISOString(),
                procedureId: last.procedureId,
              }),
            ).toString('base64url')
          : null,
    };
  }

  async function listPublishedTingProcedures(): Promise<TingCatalogEntry[]> {
    const records = await model()
      .find({ ...scope(), published: { $ne: null } })
      .sort({ procedureId: 1 })
      .lean<TingProcedureRecord[]>();
    return records.map(catalogEntry);
  }

  async function getPublishedTingProcedure(
    procedureId: string,
    revisionId?: string,
  ): Promise<TingCatalogEntry | null> {
    const record = await model()
      .findOne({
        ...scope(),
        procedureId,
        published: { $ne: null },
        ...(revisionId ? { 'published.revisionId': revisionId } : {}),
      })
      .lean<TingProcedureRecord>();
    return record ? catalogEntry(record) : null;
  }

  async function createTingProcedure(
    actorId: string,
    raw: TingProcedureCreateInput,
  ): Promise<TingProcedureDto> {
    const input = tingProcedureCreateSchema.parse(raw);
    const tenantScope = scope();
    await model().init();
    const payloadHash = hash(input);
    const filter = { ...tenantScope, createdBy: actorId, createRequestId: input.requestId };
    const existing = await model().findOne(filter).lean<TingProcedureRecord>();
    if (existing) {
      if (existing.createPayloadHash !== payloadHash) {
        throw new TingProcedureError(
          'conflict',
          'Diese Anfrage wurde bereits mit anderen Eingaben gespeichert.',
        );
      }
      return dto(existing);
    }
    try {
      const now = new Date();
      const text = { title: input.title, description: input.description };
      const record = await model().create({
        procedureId: randomUUID(),
        draft: text,
        published:
          input.intent === 'publish'
            ? {
                ...text,
                revisionId: randomUUID(),
                version: 1,
                publishedAt: now,
                publishedBy: actorId,
              }
            : null,
        editRevision: 1,
        createdBy: actorId,
        updatedBy: actorId,
        createRequestId: input.requestId,
        createPayloadHash: payloadHash,
        lastMutation: null,
      });
      return dto(record.toObject());
    } catch (error) {
      if (!(error instanceof mongoose.mongo.MongoServerError) || error.code !== 11000) {
        throw error;
      }
      const winner = await model().findOne(filter).lean<TingProcedureRecord>();
      if (!winner || winner.createPayloadHash !== payloadHash) {
        throw new TingProcedureError(
          'conflict',
          'Diese Anfrage wurde bereits mit anderen Eingaben gespeichert.',
        );
      }
      return dto(winner);
    }
  }

  async function updateTingProcedure(
    actorId: string,
    procedureId: string,
    raw: TingProcedureUpdateInput,
  ): Promise<TingProcedureDto> {
    const input = tingProcedureUpdateSchema.parse(raw);
    const filter = { ...scope(), procedureId };
    const payloadHash = hash(input);
    const record = await model().findOne(filter).lean<TingProcedureRecord>();
    if (!record) {
      throw new TingProcedureError('not_found', 'Das Verfahren wurde nicht gefunden.');
    }
    const replay = (current: TingProcedureRecord): boolean => {
      if (
        current.lastMutation?.actorId !== actorId ||
        current.lastMutation.requestId !== input.requestId
      ) {
        return false;
      }
      if (current.lastMutation.payloadHash !== payloadHash) {
        throw new TingProcedureError(
          'conflict',
          'Diese Anfrage wurde bereits mit anderen Eingaben gespeichert.',
        );
      }
      return true;
    };
    if (replay(record)) {
      return dto(record);
    }
    if (record.editRevision !== input.expectedEditRevision) {
      throw new TingProcedureError(
        'conflict',
        'Das Verfahren wurde inzwischen geändert. Bitte laden Sie den aktuellen Stand.',
      );
    }
    const text = { title: input.title, description: input.description };
    const draftChanged =
      record.draft.title !== text.title || record.draft.description !== text.description;
    const publishChanged =
      input.intent === 'publish' &&
      (record.published?.title !== text.title ||
        record.published?.description !== text.description);
    const changed = draftChanged || publishChanged;
    const editRevision = record.editRevision + (changed ? 1 : 0);
    const now = new Date();
    const update = {
      draft: text,
      editRevision,
      ...(changed ? { updatedAt: now, updatedBy: actorId } : {}),
      ...(publishChanged
        ? {
            published: {
              ...text,
              revisionId: randomUUID(),
              version: (record.published?.version ?? 0) + 1,
              publishedAt: now,
              publishedBy: actorId,
            },
          }
        : {}),
      lastMutation: {
        actorId,
        requestId: input.requestId,
        payloadHash,
        resultingEditRevision: editRevision,
      },
    };
    const updated = await model()
      .findOneAndUpdate(
        { ...filter, editRevision: input.expectedEditRevision },
        { $set: update },
        { new: true, runValidators: true, timestamps: false },
      )
      .lean<TingProcedureRecord>();
    if (updated) {
      return dto(updated);
    }
    const current = await model().findOne(filter).lean<TingProcedureRecord>();
    if (current && replay(current)) {
      return dto(current);
    }
    throw new TingProcedureError(
      'conflict',
      'Das Verfahren wurde inzwischen geändert. Bitte laden Sie den aktuellen Stand.',
    );
  }

  return {
    getTingProcedure,
    listTingProcedures,
    createTingProcedure,
    updateTingProcedure,
    listPublishedTingProcedures,
    getPublishedTingProcedure,
  };
}
