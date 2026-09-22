import { randomUUID } from 'node:crypto';
import {
  CatalogEntrySchema,
  TingIntakeStateSchema,
  TingIntakeDecisionSchema,
  tingIntakeSchema,
} from 'librechat-data-provider';
import type {
  TingIntakeDecision,
  TingIntakeState,
  TingMatchRequest,
  TingMatchResult,
  TingMatchConcern,
  TingIntake,
  CatalogEntry,
} from 'librechat-data-provider';
import type { Matcher, TingStructuredModel } from './matcher';
import {
  requireTing,
  TingIntakeError,
  ensureTingNotAborted,
  sameTingProcedure,
  validateTingEvidence,
  validateTingMatchRequest,
  validateTingMatchResult,
} from './validation';
import { TING_CHAT_PROMPT, TING_CHAT_PROMPT_VERSION } from './prompts';

export type TingIntakeTurn = { reply: string; tingIntake: TingIntake };
type SuccessfulMatch = Extract<TingMatchResult, { status: 'ok' }>;

export function validateTingDecision(
  input: unknown,
  request: TingMatchRequest,
  result: SuccessfulMatch,
  priorState: TingIntakeState,
): TingIntakeDecision {
  const parsed = TingIntakeDecisionSchema.safeParse(input);
  requireTing(parsed.success, 'The conversation decision does not satisfy its contract.');
  const decision = parsed.data;
  const matches = new Map(result.concerns.map((concern) => [concern.key, concern]));
  const prior = new Map(priorState.concerns.map((concern) => [concern.id, concern]));
  const keys = new Set<string>();
  requireTing(
    decision.concerns.length === result.concerns.length,
    'The conversation agent must preserve every matcher concern.',
  );
  for (const concern of decision.concerns) {
    const match = matches.get(concern.key);
    requireTing(
      match != null &&
        !keys.has(concern.key) &&
        match.existingId === concern.existingId &&
        match.summary === concern.summary,
      'The conversation agent cannot change matcher concern identities or summaries.',
    );
    keys.add(concern.key);
  }
  validateTingEvidence(decision.focusEvidence, request);
  requireTing(
    decision.focusEvidence.every((evidence) => evidence.messageId === request.currentMessageId),
    'An explicit focus must be evidenced by the current user message.',
  );
  if (decision.outcome === 'respond') {
    requireTing(
      result.concerns.length === 0 &&
        decision.focusKey == null &&
        decision.candidate == null &&
        decision.quickReplies.length === 0 &&
        decision.focusEvidence.length === 0,
      'A conversational response cannot change an identified concern.',
    );
    return decision;
  }
  requireTing(result.concerns.length > 0, 'A routing decision requires an affected concern.');
  if (decision.outcome === 'multiple') {
    requireTing(
      result.concerns.length >= 2 && decision.focusKey == null && decision.candidate == null,
      'A multiple-concern decision needs separate concerns and no selected focus.',
    );
    return decision;
  }
  const focus = decision.focusKey == null ? null : matches.get(decision.focusKey);
  requireTing(focus != null, 'The conversation focus must be a matcher concern.');
  if (
    result.concerns.length > 1 &&
    (priorState.focusConcernId == null || focus.existingId !== priorState.focusConcernId)
  ) {
    requireTing(
      decision.focusEvidence.length > 0,
      'Choosing among multiple concerns needs an explicit current user focus.',
    );
  }
  if (decision.outcome !== 'start') {
    requireTing(
      decision.candidate == null,
      'Only an immediate start can supply a new procedure candidate.',
    );
  }
  if (decision.outcome === 'clarify') {
    requireTing(
      focus.assessment === 'needs_information',
      'A classification question must reflect the matcher missing information.',
    );
    return decision;
  }
  requireTing(
    decision.quickReplies.length === 0,
    'Only a needed clarification or focus question may present answer buttons.',
  );
  if (decision.outcome === 'unsupported') {
    requireTing(
      focus.assessment === 'unsupported',
      'An unavailable offer requires an understood unsupported concern.',
    );
    return decision;
  }
  requireTing(
    focus.assessment === 'matched' && focus.selected != null,
    'Starting or continuing requires the same current matcher result.',
  );
  if (decision.outcome === 'continue') {
    const existing = focus.existingId == null ? null : prior.get(focus.existingId);
    requireTing(
      existing?.assessment === 'started' &&
        existing.procedure != null &&
        existing.procedure.procedureId === focus.selected.procedureId,
      'Continuation requires the same already started procedure.',
    );
    return decision;
  }
  const candidate = decision.candidate;
  const selected = focus.candidates.find((item) =>
    sameTingProcedure(item.procedure, focus.selected),
  );
  requireTing(
    candidate != null &&
      selected != null &&
      sameTingProcedure(candidate, focus.selected) &&
      candidate.unresolvedQuestions.length === 0 &&
      JSON.stringify(candidate.evidence) === JSON.stringify(selected.evidence),
    'The start must preserve the matcher selected procedure and original evidence.',
  );
  const existing = focus.existingId == null ? null : prior.get(focus.existingId);
  requireTing(
    existing?.assessment !== 'started' ||
      existing.procedure?.procedureId !== focus.selected.procedureId,
    'An already started procedure must continue without starting it again.',
  );
  return decision;
}

function resolveProcedure(
  concern: TingMatchConcern,
  request: TingMatchRequest,
): CatalogEntry | null {
  if (concern.assessment !== 'matched' || concern.selected == null) {
    return null;
  }
  const entry = request.catalog.entries.find((item) => sameTingProcedure(item, concern.selected));
  requireTing(entry != null, 'A selected procedure must exist in the current catalog.');
  return entry;
}

function applyDecision(
  decision: TingIntakeDecision,
  request: TingMatchRequest,
  result: SuccessfulMatch,
  priorState: TingIntakeState,
): TingIntakeState {
  if (decision.outcome === 'respond') {
    return priorState;
  }
  const concerns = new Map(priorState.concerns.map((concern) => [concern.id, concern]));
  const identities = new Map<string, string>();
  for (const match of result.concerns) {
    const id = match.existingId ?? randomUUID();
    identities.set(match.key, id);
    const previous = concerns.get(id);
    const stillStarted =
      previous?.assessment === 'started' &&
      match.assessment === 'matched' &&
      previous.procedure?.procedureId === match.selected?.procedureId;
    concerns.set(id, {
      id,
      summary: match.summary,
      evidence: match.evidence,
      assessment: stillStarted ? 'started' : match.assessment,
      procedure: stillStarted ? previous.procedure : resolveProcedure(match, request),
    });
  }
  const focusConcernId =
    decision.focusKey == null ? null : (identities.get(decision.focusKey) ?? null);
  if (focusConcernId != null && (decision.outcome === 'start' || decision.outcome === 'continue')) {
    const focus = concerns.get(focusConcernId);
    requireTing(focus != null, 'The focused concern must have been saved.');
    const historical = priorState.concerns.find((concern) => concern.id === focusConcernId);
    concerns.set(focusConcernId, {
      ...focus,
      assessment: 'started',
      procedure:
        decision.outcome === 'continue' ? (historical?.procedure ?? null) : focus.procedure,
    });
  }
  return { concerns: [...concerns.values()], focusConcernId };
}

export async function runTingIntakeTurn({
  request: input,
  priorState: state,
  matcher,
  model,
  signal,
}: {
  request: TingMatchRequest;
  priorState: TingIntakeState;
  matcher: Matcher;
  model: TingStructuredModel;
  signal: AbortSignal;
}): Promise<TingIntakeTurn> {
  ensureTingNotAborted(signal);
  const request = validateTingMatchRequest(input);
  const priorState = TingIntakeStateSchema.parse(state);
  const actualPrior = priorState.concerns.map((concern) => ({
    id: concern.id,
    summary: concern.summary,
    evidence: concern.evidence,
    procedure:
      concern.procedure == null
        ? null
        : {
            procedureId: concern.procedure.procedureId,
            revisionId: concern.procedure.revisionId,
          },
  }));
  requireTing(
    JSON.stringify(request.priorConcerns) === JSON.stringify(actualPrior),
    'The matcher must receive the authoritative branch concern state.',
  );
  let result: TingMatchResult;
  try {
    result = validateTingMatchResult(
      await matcher.match(structuredClone(request), { signal }),
      request,
      matcher.metrics,
    );
  } catch (error) {
    ensureTingNotAborted(signal);
    if (error instanceof TingIntakeError) {
      throw error;
    }
    throw new TingIntakeError('unavailable', 'The matcher could not complete the request.');
  }
  ensureTingNotAborted(signal);
  if (result.status === 'error') {
    throw new TingIntakeError(
      result.error.code,
      'The matcher could not complete the request.',
      result.error.retryable,
    );
  }
  let output: Awaited<ReturnType<TingStructuredModel['generate']>>;
  try {
    output = await model.generate({
      schemaName: 'ting_intake_decision',
      schema: TingIntakeDecisionSchema,
      system: TING_CHAT_PROMPT,
      input: { request, matchResult: result, priorState },
      signal,
    });
  } catch (error) {
    ensureTingNotAborted(signal);
    if (error instanceof TingIntakeError) {
      throw error;
    }
    throw new TingIntakeError(
      'unavailable',
      'The conversation model could not complete the request.',
    );
  }
  ensureTingNotAborted(signal);
  const decision = validateTingDecision(output.value, request, result, priorState);
  const tingIntake = tingIntakeSchema.parse({
    schemaVersion: 'ting.intake.v1',
    state: applyDecision(decision, request, result, priorState),
    actions: decision.quickReplies.map((reply) => ({ id: randomUUID(), type: 'reply', ...reply })),
    audit: {
      mode: 'matcher',
      result,
      catalog: request.catalog,
      messageIds: request.messages.map((message) => message.messageId),
      chatPromptVersion: TING_CHAT_PROMPT_VERSION,
      chatReportedModelId: output.reportedModelId,
    },
  });
  return { reply: decision.reply, tingIntake };
}

/** Explicit catalog selection uses a server-resolved published revision, never a model guess. */
export function startTingProcedure({
  procedure: input,
  state,
  requestId,
  currentMessageId,
}: {
  procedure: CatalogEntry;
  state: TingIntakeState;
  requestId: string;
  currentMessageId: string;
}): TingIntakeTurn {
  const procedure = CatalogEntrySchema.parse(input);
  const priorState = TingIntakeStateSchema.parse(state);
  const concern = {
    id: randomUUID(),
    summary: procedure.title,
    evidence: [],
    assessment: 'started' as const,
    procedure,
  };
  return {
    reply: `Wir beginnen mit dem Verfahren „${procedure.title}“.`,
    tingIntake: tingIntakeSchema.parse({
      schemaVersion: 'ting.intake.v1',
      state: { concerns: [...priorState.concerns, concern], focusConcernId: concern.id },
      actions: [],
      audit: { mode: 'selection', requestId, currentMessageId, procedure },
    }),
  };
}
