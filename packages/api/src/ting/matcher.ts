import { TingLlmMatchPayloadSchema } from 'librechat-data-provider';
import type {
  TingMatcherProvenance,
  TingMatchRequest,
  TingMatchResult,
} from 'librechat-data-provider';
import type { z } from 'zod';
import type { TingScoreMetric } from './validation';
import {
  TingIntakeError,
  ensureTingNotAborted,
  validateTingMatchRequest,
  validateTingMatchResult,
} from './validation';
import { TING_MATCHER_PROMPT, TING_MATCHER_PROMPT_VERSION } from './prompts';

export interface TingStructuredModel {
  generate(input: {
    schemaName: string;
    schema: z.ZodType<unknown>;
    system: string;
    input: unknown;
    signal: AbortSignal;
  }): Promise<{ value: unknown; reportedModelId: string | null }>;
}

export interface Matcher {
  readonly metrics?: readonly TingScoreMetric[];
  match(request: TingMatchRequest, options: { signal: AbortSignal }): Promise<TingMatchResult>;
}

export function createLlmMatcher({
  model,
  configuredModelId,
}: {
  model: TingStructuredModel;
  configuredModelId: string;
}): Matcher {
  if (!configuredModelId.trim()) {
    throw new TingIntakeError('configuration', 'The configured matcher model is missing.', false);
  }
  return {
    metrics: [],
    async match(input, { signal }) {
      const request = validateTingMatchRequest(input);
      let reportedModelId: string | null = null;
      const provenance = (): TingMatcherProvenance => ({
        matcherId: 'llm',
        implementationVersion: 'ting.llm-matcher.v1',
        policyVersion: 'ting.semantic-routing.v1',
        components: [
          {
            componentId: 'semantic-match',
            configuredModelId,
            reportedModelId,
            promptVersion: TING_MATCHER_PROMPT_VERSION,
          },
        ],
      });
      const envelope = () => ({
        contractVersion: 'ting.matcher.v1' as const,
        requestId: request.requestId,
        catalogSnapshotId: request.catalog.snapshotId,
        provenance: provenance(),
      });
      try {
        ensureTingNotAborted(signal);
        const output = await model.generate({
          schemaName: 'ting_match_payload',
          schema: TingLlmMatchPayloadSchema,
          system: TING_MATCHER_PROMPT,
          input: request,
          signal,
        });
        reportedModelId = output.reportedModelId;
        ensureTingNotAborted(signal);
        const payload = TingLlmMatchPayloadSchema.safeParse(output.value);
        if (!payload.success) {
          throw new TingIntakeError(
            'invalid_output',
            'The matcher model returned an invalid payload.',
          );
        }
        return validateTingMatchResult(
          { ...envelope(), status: 'ok', concerns: payload.data.concerns },
          request,
        );
      } catch (error) {
        let failure =
          error instanceof TingIntakeError
            ? error
            : new TingIntakeError('unavailable', 'The matcher provider failed.');
        if (signal.aborted) {
          failure = new TingIntakeError('cancelled', 'The intake turn was cancelled.', false);
        }
        return {
          ...envelope(),
          status: 'error',
          error: { code: failure.code, retryable: failure.retryable },
        };
      }
    },
  };
}
