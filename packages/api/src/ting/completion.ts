import { z } from 'zod';
import type { TingStructuredModel } from './matcher';
import { countTokens } from '~/utils/tokenizer';
import { TingIntakeError } from './validation';

export type TingResponseFormat = {
  type: 'json_schema';
  json_schema: { name: string; strict?: boolean; schema?: Record<string, unknown> };
};

export type TingCompletionRequest = {
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  response_format: TingResponseFormat;
  max_completion_tokens: number;
  stream: false;
};

export type TingModelUsage = {
  configuredModelId: string;
  reportedModelId: string | null;
  schemaName: string;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
};

export type TingCompletionDependencies = {
  configuredModelId: string;
  timeoutMs: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  formatSchema: (schema: z.ZodTypeAny, name: string) => TingResponseFormat;
  complete: (request: TingCompletionRequest, options: { signal: AbortSignal }) => Promise<unknown>;
  onUsage: (usage: TingModelUsage) => Promise<void>;
};

const providerResponseSchema = z.object({
  model: z.string().optional(),
  choices: z
    .array(
      z.object({
        finish_reason: z.string().nullable(),
        message: z.object({
          content: z.string().nullable(),
          refusal: z.string().nullable().optional(),
        }),
      }),
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: z.number().int().nonnegative(),
      completion_tokens: z.number().int().nonnegative(),
      prompt_tokens_details: z
        .object({ cached_tokens: z.number().int().nonnegative().optional() })
        .optional(),
    })
    .nullable()
    .optional(),
});

export class TingCompletionError extends TingIntakeError {
  constructor(
    public readonly code:
      | 'configuration'
      | 'context_limit'
      | 'timeout'
      | 'unavailable'
      | 'invalid_output'
      | 'cancelled',
  ) {
    super(code, 'TING kann gerade nicht antworten. Bitte versuchen Sie es erneut.');
  }
}

/** Provider output stays private until the shared runtime contract has accepted it. */
export function createTingStructuredModel(deps: TingCompletionDependencies): TingStructuredModel {
  return {
    async generate({ schemaName, schema, system, input, signal }) {
      if (signal.aborted) throw new TingCompletionError('cancelled');
      if (!deps.configuredModelId) throw new TingCompletionError('configuration');
      const format = deps.formatSchema(schema, schemaName);
      const content = JSON.stringify(input);
      const inputTokens = await countTokens(JSON.stringify({ system, content, format }));
      if (inputTokens > deps.maxInputTokens) throw new TingCompletionError('context_limit');
      const timeout = AbortSignal.timeout(deps.timeoutMs);
      const requestSignal = AbortSignal.any([signal, timeout]);
      let raw: unknown;
      try {
        raw = await deps.complete(
          {
            model: deps.configuredModelId,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content },
            ],
            response_format: format,
            max_completion_tokens: deps.maxOutputTokens,
            stream: false,
          },
          { signal: requestSignal },
        );
      } catch {
        if (signal.aborted) throw new TingCompletionError('cancelled');
        if (timeout.aborted) throw new TingCompletionError('timeout');
        throw new TingCompletionError('unavailable');
      }
      const parsed = providerResponseSchema.safeParse(raw);
      if (!parsed.success) throw new TingCompletionError('invalid_output');
      const response = parsed.data;
      const reportedModelId = response.model ?? null;
      if (response.usage) {
        await deps.onUsage({
          configuredModelId: deps.configuredModelId,
          reportedModelId,
          schemaName,
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          cachedTokens: response.usage.prompt_tokens_details?.cached_tokens ?? 0,
        });
      }
      if (requestSignal.aborted)
        throw new TingCompletionError(signal.aborted ? 'cancelled' : 'timeout');
      const choice = response.choices[0];
      if (choice.finish_reason !== 'stop' || choice.message.refusal || !choice.message.content) {
        throw new TingCompletionError('invalid_output');
      }
      let value: unknown;
      try {
        value = JSON.parse(choice.message.content);
      } catch {
        throw new TingCompletionError('invalid_output');
      }
      const validated = schema.safeParse(value);
      if (!validated.success) throw new TingCompletionError('invalid_output');
      return { value: validated.data, reportedModelId };
    },
  };
}
