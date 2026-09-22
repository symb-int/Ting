import { randomUUID } from 'node:crypto';
import { TingProcedureCreateInputSchema, tingActionSchema } from 'librechat-data-provider';
import type {
  TingIntakeDecision,
  TingMatchConcern,
  TingMatchRequest,
  TingIntakeState,
  TingMatchResult,
  CatalogEntry,
} from 'librechat-data-provider';
import type { Matcher, TingStructuredModel } from './matcher';
import { createTingCatalog, TingIntakeError, validateTingMatchResult } from './validation';
import { runTingIntakeTurn, startTingProcedure, validateTingDecision } from './intake';
import { createLlmMatcher } from './matcher';

const procedure: CatalogEntry = {
  procedureId: '71976d30-3cd4-4a1f-9e40-6d891fded862',
  revisionId: '71976d30-3cd4-4a1f-9e40-6d891fded863',
  version: 1,
  title: 'Repair reimbursement',
  description: 'Reimbursement for repairs of eligible equipment.',
};
const evidence = [{ messageId: 'current-user', quote: 'I need reimbursement for the repair.' }];
const emptyState: TingIntakeState = { concerns: [], focusConcernId: null };

function request(state: TingIntakeState = emptyState): TingMatchRequest {
  return {
    contractVersion: 'ting.matcher.v1',
    requestId: randomUUID(),
    conversationId: 'conversation',
    parentMessageId: null,
    currentMessageId: 'current-user',
    locale: 'en',
    messages: [{ messageId: 'current-user', role: 'user', text: evidence[0].quote }],
    priorConcerns: state.concerns.map((concern) => ({
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
    })),
    catalog: createTingCatalog([procedure]),
  };
}

function concern(overrides: Partial<TingMatchConcern> = {}): TingMatchConcern {
  return {
    key: 'repair',
    existingId: null,
    summary: 'Reimbursement of a repair',
    evidence,
    assessment: 'matched',
    candidates: [
      {
        procedure: {
          procedureId: procedure.procedureId,
          revisionId: procedure.revisionId,
        },
        evidence,
        scores: [],
      },
    ],
    selected: { procedureId: procedure.procedureId, revisionId: procedure.revisionId },
    missingInformation: [],
    ...overrides,
  };
}

function decision(
  matches = [concern()],
  overrides: Partial<TingIntakeDecision> = {},
): TingIntakeDecision {
  return {
    outcome: 'start',
    reply: 'We begin the repair reimbursement procedure.',
    concerns: matches.map(({ key, existingId, summary }) => ({ key, existingId, summary })),
    focusKey: matches[0]?.key ?? null,
    focusEvidence: [],
    candidate: {
      procedureId: procedure.procedureId,
      revisionId: procedure.revisionId,
      evidence,
      unresolvedQuestions: [],
    },
    quickReplies: [],
    ...overrides,
  };
}

function modelBoundary(values: unknown[]): TingStructuredModel & {
  calls: Parameters<TingStructuredModel['generate']>[0][];
} {
  const calls: Parameters<TingStructuredModel['generate']>[0][] = [];
  return {
    calls,
    async generate(input) {
      calls.push(input);
      return { value: values[calls.length - 1], reportedModelId: 'provider-actual-model' };
    },
  };
}

function matcherResult(
  input: TingMatchRequest,
  concerns = [concern()],
): Extract<TingMatchResult, { status: 'ok' }> {
  return {
    contractVersion: 'ting.matcher.v1',
    requestId: input.requestId,
    catalogSnapshotId: input.catalog.snapshotId,
    provenance: {
      matcherId: 'test-contract-adapter',
      implementationVersion: '1',
      policyVersion: '1',
      components: [
        {
          componentId: 'unit-boundary',
          configuredModelId: null,
          reportedModelId: null,
          promptVersion: null,
        },
      ],
    },
    status: 'ok',
    concerns,
  };
}

describe('TING contracts and semantic decision boundary', () => {
  test('procedure writes normalize only business text and reject caller-owned metadata', () => {
    expect(
      TingProcedureCreateInputSchema.parse({
        title: ' Example ',
        description: ' ',
        intent: 'save',
        requestId: randomUUID(),
      }),
    ).toMatchObject({ title: 'Example', description: '' });
    expect(
      TingProcedureCreateInputSchema.safeParse({
        title: 'Example',
        description: '',
        intent: 'publish',
        requestId: randomUUID(),
      }).success,
    ).toBe(false);
    expect(
      TingProcedureCreateInputSchema.safeParse({
        title: 'Example',
        description: 'Text',
        intent: 'publish',
        requestId: randomUUID(),
        tenantId: 'someone-else',
      }).success,
    ).toBe(false);
    expect(
      tingActionSchema.safeParse({
        type: 'reply',
        actionId: 'a',
        sourceMessageId: 'm',
        requestId: randomUUID(),
        text: 'forged',
      }).success,
    ).toBe(false);
  });

  test('catalog identity is canonical and changes with a published revision', () => {
    const second = { ...procedure, procedureId: '81976d30-3cd4-4a1f-9e40-6d891fded862' };
    expect(createTingCatalog([procedure, second])).toEqual(createTingCatalog([second, procedure]));
    expect(
      createTingCatalog([{ ...procedure, description: 'A revised scope.' }]).snapshotId,
    ).not.toEqual(createTingCatalog([procedure]).snapshotId);
    expect(() => createTingCatalog([procedure, procedure])).toThrow(TingIntakeError);
  });

  test('two structured calls yield a start with actual adapter provenance and no confirmation actions', async () => {
    const model = modelBoundary([{ concerns: [concern()] }, decision()]);
    const matcher = createLlmMatcher({ model, configuredModelId: 'configured-model' });
    const signal = new AbortController().signal;
    const output = await runTingIntakeTurn({
      request: request(),
      priorState: emptyState,
      matcher,
      model,
      signal,
    });
    expect(model.calls.map((call) => call.schemaName)).toEqual([
      'ting_match_payload',
      'ting_intake_decision',
    ]);
    expect(model.calls.every((call) => call.signal === signal)).toBe(true);
    expect(output.tingIntake.state.concerns).toEqual([
      expect.objectContaining({ assessment: 'started', procedure }),
    ]);
    expect(output.tingIntake.actions).toEqual([]);
    expect(output.tingIntake.audit).toMatchObject({
      mode: 'matcher',
      result: {
        provenance: {
          matcherId: 'llm',
          components: [
            { configuredModelId: 'configured-model', reportedModelId: 'provider-actual-model' },
          ],
        },
      },
    });
  });

  test('a different matcher implementation works through the same conversation contract', async () => {
    const input = request();
    const model = modelBoundary([decision()]);
    const matcher: Matcher = {
      async match(received) {
        return matcherResult(received);
      },
    };
    const output = await runTingIntakeTurn({
      request: input,
      priorState: emptyState,
      matcher,
      model,
      signal: new AbortController().signal,
    });
    expect(model.calls).toHaveLength(1);
    expect(output.tingIntake.audit).toMatchObject({
      mode: 'matcher',
      result: { provenance: { matcherId: 'test-contract-adapter' } },
    });
  });

  test.each(['assistant-evidence', 'quote', 'revision', 'request', 'score'])(
    'rejects %s corruption before the conversational call',
    async (corruption) => {
      const input = request();
      const match = concern();
      const result = matcherResult(input, [match]);
      if (corruption === 'assistant-evidence') {
        input.messages.unshift({
          messageId: 'assistant',
          role: 'assistant',
          text: evidence[0].quote,
        });
        match.evidence = [{ messageId: 'assistant', quote: evidence[0].quote }];
      } else if (corruption === 'quote') {
        match.evidence = [{ messageId: 'current-user', quote: 'A statement that never happened.' }];
      } else if (corruption === 'revision') {
        match.candidates[0].procedure = {
          ...match.candidates[0].procedure,
          revisionId: randomUUID(),
        };
      } else if (corruption === 'request') {
        result.requestId = 'stale';
      } else {
        match.candidates[0].scores = [
          { metricId: 'imaginary-confidence', value: 0.99, calibrationId: null },
        ];
      }
      const model = modelBoundary([]);
      const matcher: Matcher = {
        async match() {
          return result;
        },
      };
      await expect(
        runTingIntakeTurn({
          request: input,
          priorState: emptyState,
          matcher,
          model,
          signal: new AbortController().signal,
        }),
      ).rejects.toMatchObject({ code: 'invalid_output' });
      expect(model.calls).toHaveLength(0);
    },
  );

  test('score validation accepts only adapter-defined ranges and actual calibrations', () => {
    const input = request();
    const match = concern();
    match.candidates[0].scores = [{ metricId: 'rank.v1', value: 12, calibrationId: null }];
    const result = matcherResult(input, [match]);
    const metric = {
      metricId: 'rank.v1',
      source: 'Unit-boundary retrieval',
      meaning: 'Uncalibrated ranking',
      minimum: 0,
      maximum: 20,
      direction: 'descending' as const,
      calibrationIds: [],
    };
    expect(validateTingMatchResult(result, input, [metric])).toEqual(result);
    match.candidates[0].scores[0].calibrationId = 'fabricated';
    expect(() => validateTingMatchResult(result, input, [metric])).toThrow(TingIntakeError);
  });

  test('a conversation model cannot promote uncertainty to a start', async () => {
    const unclear = concern({
      assessment: 'needs_information',
      selected: null,
      missingInformation: ['Which equipment needs repair?'],
    });
    const model = modelBoundary([{ concerns: [unclear] }, decision([unclear])]);
    await expect(
      runTingIntakeTurn({
        request: request(),
        priorState: emptyState,
        matcher: createLlmMatcher({ model, configuredModelId: 'model' }),
        model,
        signal: new AbortController().signal,
      }),
    ).rejects.toMatchObject({ code: 'invalid_output' });
  });

  test('model-generated provenance is not accepted as matcher payload', async () => {
    const model = modelBoundary([{ concerns: [concern()], provenance: { matcherId: 'forged' } }]);
    const result = await createLlmMatcher({ model, configuredModelId: 'configured' }).match(
      request(),
      { signal: new AbortController().signal },
    );
    expect(result).toMatchObject({
      status: 'error',
      error: { code: 'invalid_output' },
      provenance: { matcherId: 'llm' },
    });
  });

  test('technical provider failures and malformed outputs never become unsupported', async () => {
    const model: TingStructuredModel = {
      async generate() {
        throw new TingIntakeError('context_limit', 'Too large.');
      },
    };
    await expect(
      runTingIntakeTurn({
        request: request(),
        priorState: emptyState,
        matcher: createLlmMatcher({ model, configuredModelId: 'model' }),
        model,
        signal: new AbortController().signal,
      }),
    ).rejects.toMatchObject({ code: 'context_limit' });
  });

  test('abort between matcher and conversation prevents the second model call', async () => {
    const controller = new AbortController();
    const model: TingStructuredModel = {
      async generate() {
        controller.abort();
        return { value: { concerns: [concern()] }, reportedModelId: null };
      },
    };
    await expect(
      runTingIntakeTurn({
        request: request(),
        priorState: emptyState,
        matcher: createLlmMatcher({ model, configuredModelId: 'model' }),
        model,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ code: 'cancelled' });
  });

  test('multiple concerns keep their matched snapshots until a citizen chooses focus', async () => {
    const extra = concern({
      key: 'other',
      summary: 'A second unrelated goal',
      assessment: 'unsupported',
      selected: null,
      candidates: [],
    });
    const matches = [concern(), extra];
    const model = modelBoundary([
      { concerns: matches },
      decision(matches, {
        outcome: 'multiple',
        candidate: null,
        focusKey: null,
        reply: 'Which request shall we start with?',
        quickReplies: [{ label: 'Repair', text: 'Begin with reimbursement for the repair.' }],
      }),
    ]);
    const output = await runTingIntakeTurn({
      request: request(),
      priorState: emptyState,
      matcher: createLlmMatcher({ model, configuredModelId: 'model' }),
      model,
      signal: new AbortController().signal,
    });
    expect(output.tingIntake.state.focusConcernId).toBeNull();
    expect(output.tingIntake.state.concerns).toEqual([
      expect.objectContaining({ assessment: 'matched', procedure }),
      expect.objectContaining({ assessment: 'unsupported', procedure: null }),
    ]);
    expect(output.tingIntake.actions).toEqual([
      expect.objectContaining({ type: 'reply', label: 'Repair' }),
    ]);
  });

  test('the chat cannot silently choose one of multiple concerns', () => {
    const input = request();
    const matches = [concern(), concern({ key: 'other', summary: 'Another request' })];
    expect(() =>
      validateTingDecision(decision(matches), input, matcherResult(input, matches), emptyState),
    ).toThrow(TingIntakeError);
  });

  test('continuation keeps the historical revision and unmentioned secondary concerns', async () => {
    const historical = {
      ...procedure,
      revisionId: randomUUID(),
      version: 1,
      description: 'Earlier published scope.',
    };
    const state: TingIntakeState = {
      focusConcernId: 'known',
      concerns: [
        {
          id: 'known',
          summary: 'Reimbursement of a repair',
          evidence,
          assessment: 'started',
          procedure: historical,
        },
        {
          id: 'secondary',
          summary: 'Second goal remains',
          evidence,
          assessment: 'needs_information',
          procedure: null,
        },
      ],
    };
    const matches = [concern({ existingId: 'known' })];
    const model = modelBoundary([
      { concerns: matches },
      decision(matches, { outcome: 'continue', candidate: null }),
    ]);
    const output = await runTingIntakeTurn({
      request: request(state),
      priorState: state,
      matcher: createLlmMatcher({ model, configuredModelId: 'model' }),
      model,
      signal: new AbortController().signal,
    });
    expect(output.tingIntake.state.concerns[0].procedure).toEqual(historical);
    expect(output.tingIntake.state.concerns[1]).toEqual(state.concerns[1]);
  });

  test('a correction clears the prior active assignment while keeping historical input immutable', async () => {
    const state: TingIntakeState = {
      focusConcernId: 'known',
      concerns: [
        { id: 'known', summary: 'Previous goal', evidence, assessment: 'started', procedure },
      ],
    };
    const corrected = concern({
      existingId: 'known',
      assessment: 'unsupported',
      selected: null,
      candidates: [],
    });
    const model = modelBoundary([
      { concerns: [corrected] },
      decision([corrected], { outcome: 'unsupported', candidate: null }),
    ]);
    const output = await runTingIntakeTurn({
      request: request(state),
      priorState: state,
      matcher: createLlmMatcher({ model, configuredModelId: 'model' }),
      model,
      signal: new AbortController().signal,
    });
    expect(output.tingIntake.state.concerns[0]).toMatchObject({
      assessment: 'unsupported',
      procedure: null,
    });
    expect(state.concerns[0]).toMatchObject({ assessment: 'started', procedure });
  });

  test('asking the focus after another request preserves an unchanged already started procedure', async () => {
    const historical = { ...procedure, revisionId: randomUUID() };
    const state: TingIntakeState = {
      focusConcernId: 'known',
      concerns: [
        {
          id: 'known',
          summary: 'Previous goal',
          evidence,
          assessment: 'started',
          procedure: historical,
        },
      ],
    };
    const matches = [
      concern({ existingId: 'known' }),
      concern({
        key: 'new',
        existingId: null,
        assessment: 'needs_information',
        selected: null,
        missingInformation: ['A different goal'],
      }),
    ];
    const model = modelBoundary([
      { concerns: matches },
      decision(matches, {
        outcome: 'multiple',
        focusKey: null,
        candidate: null,
        reply: 'Which concern would you like to address now?',
      }),
    ]);
    const output = await runTingIntakeTurn({
      request: request(state),
      priorState: state,
      matcher: createLlmMatcher({ model, configuredModelId: 'model' }),
      model,
      signal: new AbortController().signal,
    });
    expect(output.tingIntake.state.focusConcernId).toBeNull();
    expect(output.tingIntake.state.concerns[0]).toMatchObject({
      assessment: 'started',
      procedure: historical,
    });
  });

  test('a greeting preserves state without inventing a routing result', async () => {
    const model = modelBoundary([
      { concerns: [] },
      decision([], { outcome: 'respond', candidate: null, reply: 'Hello.' }),
    ]);
    const output = await runTingIntakeTurn({
      request: request(),
      priorState: emptyState,
      matcher: createLlmMatcher({ model, configuredModelId: 'model' }),
      model,
      signal: new AbortController().signal,
    });
    expect(output.tingIntake.state).toEqual(emptyState);
  });

  test('explicit selection starts directly without fabricated model evidence or provenance', () => {
    const output = startTingProcedure({
      procedure,
      state: emptyState,
      requestId: randomUUID(),
      currentMessageId: 'choice',
    });
    expect(output.reply).toBe('Wir beginnen mit dem Verfahren „Repair reimbursement“.');
    expect(output.tingIntake.audit).toMatchObject({ mode: 'selection', procedure });
    expect(output.tingIntake.state.concerns[0].evidence).toEqual([]);
    expect(output.tingIntake.actions).toEqual([]);
  });
});
