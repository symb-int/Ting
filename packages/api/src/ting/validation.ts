import { createHash } from 'node:crypto';
import {
  TingCatalogSchema,
  tingMatchRequestSchema,
  tingMatchResultSchema,
} from 'librechat-data-provider';
import type {
  TingCatalogSnapshot,
  TingMatcherError,
  TingMatchRequest,
  TingMatchResult,
  TingEvidence,
  CatalogEntry,
  ProcedureRef,
} from 'librechat-data-provider';

export class TingIntakeError extends Error {
  readonly code: TingMatcherError['code'];
  readonly retryable: boolean;

  constructor(code: TingMatcherError['code'], message: string, retryable = true) {
    super(message);
    this.name = 'TingIntakeError';
    this.code = code;
    this.retryable = retryable;
  }
}

export function requireTing(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new TingIntakeError('invalid_output', message);
  }
}

export function ensureTingNotAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new TingIntakeError('cancelled', 'The intake turn was cancelled.', false);
  }
}

export function sameTingProcedure(left: ProcedureRef | null, right: ProcedureRef | null): boolean {
  return (
    left != null &&
    right != null &&
    left.procedureId === right.procedureId &&
    left.revisionId === right.revisionId
  );
}

export function createTingCatalog(entries: CatalogEntry[]): TingCatalogSnapshot {
  const ordered = entries
    .map(({ procedureId, revisionId, version, title, description }) => ({
      procedureId,
      revisionId,
      version,
      title,
      description,
    }))
    .sort((left, right) => {
      if (left.procedureId === right.procedureId) {
        return 0;
      }
      return left.procedureId < right.procedureId ? -1 : 1;
    });
  requireTing(
    new Set(ordered.map((entry) => entry.procedureId)).size === ordered.length,
    'The catalog has duplicate procedure identities.',
  );
  return TingCatalogSchema.parse({
    snapshotId: createHash('sha256').update(JSON.stringify(ordered), 'utf8').digest('hex'),
    entries: ordered,
  });
}

/** Score semantics belong to an adapter; undeclared metrics or calibrations are rejected. */
export interface TingScoreMetric {
  metricId: string;
  source: string;
  meaning: string;
  minimum: number;
  maximum: number;
  direction: 'ascending' | 'descending';
  calibrationIds: readonly string[];
}

export function validateTingEvidence(evidence: TingEvidence[], request: TingMatchRequest): void {
  const messages = new Map(request.messages.map((message) => [message.messageId, message]));
  for (const item of evidence) {
    const message = messages.get(item.messageId);
    requireTing(
      message?.role === 'user' && item.quote.trim().length > 0 && message.text.includes(item.quote),
      'Evidence must quote an original user message in this branch.',
    );
  }
}

export function validateTingMatchRequest(input: TingMatchRequest): TingMatchRequest {
  const request = tingMatchRequestSchema.parse(input);
  requireTing(
    new Set(request.messages.map((message) => message.messageId)).size === request.messages.length,
    'The active message branch contains duplicate identities.',
  );
  const current = request.messages[request.messages.length - 1];
  requireTing(
    current?.messageId === request.currentMessageId && current.role === 'user',
    'The current message must be the final user message in the active branch.',
  );
  requireTing(
    request.parentMessageId == null ||
      request.messages.some(
        (message) =>
          message.messageId === request.parentMessageId &&
          message.messageId !== request.currentMessageId,
      ),
    'The parent message must belong to the supplied branch.',
  );
  const catalog = createTingCatalog(request.catalog.entries);
  requireTing(
    catalog.snapshotId === request.catalog.snapshotId,
    'The catalog snapshot does not identify the supplied entries.',
  );
  requireTing(
    new Set(request.priorConcerns.map((concern) => concern.id)).size ===
      request.priorConcerns.length,
    'Prior concern identities must be unique.',
  );
  for (const concern of request.priorConcerns) {
    validateTingEvidence(concern.evidence, request);
  }
  return request;
}

export function validateTingMatchResult(
  input: unknown,
  request: TingMatchRequest,
  metrics: readonly TingScoreMetric[] = [],
): TingMatchResult {
  const parsed = tingMatchResultSchema.safeParse(input);
  requireTing(parsed.success, 'The matcher output does not satisfy its contract.');
  const result = parsed.data;
  requireTing(
    result.requestId === request.requestId &&
      result.catalogSnapshotId === request.catalog.snapshotId,
    'The matcher output belongs to a different request or catalog.',
  );
  if (result.status === 'error') {
    return result;
  }
  const known = new Set(request.priorConcerns.map((concern) => concern.id));
  const keys = new Set<string>();
  const existingIds = new Set<string>();
  const catalog = new Map(request.catalog.entries.map((entry) => [entry.procedureId, entry]));
  const definitions = new Map(metrics.map((metric) => [metric.metricId, metric]));
  requireTing(definitions.size === metrics.length, 'Score metric definitions must be unique.');
  for (const concern of result.concerns) {
    requireTing(!keys.has(concern.key), 'Matcher concern keys must be unique.');
    keys.add(concern.key);
    if (concern.existingId != null) {
      requireTing(
        known.has(concern.existingId) && !existingIds.has(concern.existingId),
        'An existing concern must belong to the active branch and be referenced once.',
      );
      existingIds.add(concern.existingId);
    }
    validateTingEvidence(concern.evidence, request);
    requireTing(concern.evidence.length > 0, 'An identified concern needs a user statement.');
    const candidates = new Set<string>();
    for (const candidate of concern.candidates) {
      requireTing(
        sameTingProcedure(
          catalog.get(candidate.procedure.procedureId) ?? null,
          candidate.procedure,
        ),
        'A candidate must identify an exact supplied catalog revision.',
      );
      requireTing(
        !candidates.has(candidate.procedure.procedureId),
        'Candidate identities must be unique.',
      );
      candidates.add(candidate.procedure.procedureId);
      validateTingEvidence(candidate.evidence, request);
      const scoreIds = new Set<string>();
      for (const score of candidate.scores) {
        const definition = definitions.get(score.metricId);
        requireTing(
          definition != null && !scoreIds.has(score.metricId),
          'Undeclared or duplicate matcher score.',
        );
        scoreIds.add(score.metricId);
        requireTing(
          Number.isFinite(definition.minimum) &&
            Number.isFinite(definition.maximum) &&
            definition.minimum <= definition.maximum &&
            definition.source.length > 0 &&
            definition.meaning.length > 0 &&
            score.value >= definition.minimum &&
            score.value <= definition.maximum &&
            (score.calibrationId == null ||
              definition.calibrationIds.includes(score.calibrationId)),
          'A matcher score does not satisfy its declared metric and calibration.',
        );
      }
    }
    if (concern.assessment === 'matched') {
      const selected = concern.candidates.find((candidate) =>
        sameTingProcedure(candidate.procedure, concern.selected),
      );
      requireTing(
        selected != null && selected.evidence.length > 0 && concern.missingInformation.length === 0,
        'A match requires one evidenced candidate and no unresolved distinction.',
      );
      continue;
    }
    requireTing(
      concern.selected == null,
      'An unresolved or unsupported concern cannot select a procedure.',
    );
    requireTing(
      concern.assessment === 'needs_information'
        ? concern.missingInformation.length > 0
        : concern.missingInformation.length === 0,
      'Missing information must agree with the matcher assessment.',
    );
  }
  return result;
}
