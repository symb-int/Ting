import { z } from 'zod';
import type { TingCompletionDependencies } from './completion';
import { createTingStructuredModel, TingCompletionError } from './completion';

const schema = z.object({ reply: z.string() }).strict();
const response = {
  model: 'reported-model',
  choices: [{ finish_reason: 'stop', message: { content: '{"reply":"Hallo"}', refusal: null } }],
  usage: { prompt_tokens: 70, completion_tokens: 8, prompt_tokens_details: { cached_tokens: 20 } },
};

function fixture(overrides: Partial<TingCompletionDependencies> = {}) {
  const complete = jest.fn().mockResolvedValue(response);
  const onUsage = jest.fn().mockResolvedValue(undefined);
  const deps: TingCompletionDependencies = {
    configuredModelId: 'configured-model',
    timeoutMs: 1000,
    maxInputTokens: 16384,
    maxOutputTokens: 2048,
    formatSchema: (_schema, name) => ({
      type: 'json_schema',
      json_schema: {
        name,
        strict: true,
        schema: {
          type: 'object',
          properties: { reply: { type: 'string' } },
          required: ['reply'],
          additionalProperties: false,
        },
      },
    }),
    complete,
    onUsage,
    ...overrides,
  };
  return { model: createTingStructuredModel(deps), complete, onUsage };
}
const input = () => ({
  schemaName: 'ting_test',
  schema,
  system: 'Return the declared object.',
  input: { text: 'Hello' },
  signal: new AbortController().signal,
});

describe('TING structured provider boundary', () => {
  it('buffers the real provider envelope and accounts the reported usage before returning validated output', async () => {
    const { model, complete, onUsage } = fixture();
    await expect(model.generate(input())).resolves.toEqual({
      value: { reply: 'Hallo' },
      reportedModelId: 'reported-model',
    });
    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'configured-model',
        stream: false,
        max_completion_tokens: 2048,
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(onUsage).toHaveBeenCalledWith({
      configuredModelId: 'configured-model',
      reportedModelId: 'reported-model',
      schemaName: 'ting_test',
      promptTokens: 70,
      completionTokens: 8,
      cachedTokens: 20,
    });
  });

  it('rejects model output with unknown fields instead of extracting an apparently valid answer', async () => {
    const { model, onUsage } = fixture({
      complete: async () => ({
        ...response,
        choices: [
          {
            finish_reason: 'stop',
            message: { content: '{"reply":"Hallo","procedureId":"forged"}' },
          },
        ],
      }),
    });
    await expect(model.generate(input())).rejects.toMatchObject({ code: 'invalid_output' });
    expect(onUsage).toHaveBeenCalledTimes(1);
  });

  it('refuses context overflow before starting a provider request', async () => {
    const { model, complete } = fixture({ maxInputTokens: 1 });
    await expect(model.generate(input())).rejects.toMatchObject({ code: 'context_limit' });
    expect(complete).not.toHaveBeenCalled();
  });

  it('passes cancellation into the provider and never converts it into unsupported', async () => {
    const controller = new AbortController();
    const { model } = fixture({
      complete: async (_request, options) => {
        controller.abort();
        expect(options.signal.aborted).toBe(true);
        throw new Error('aborted');
      },
    });
    await expect(model.generate({ ...input(), signal: controller.signal })).rejects.toMatchObject({
      code: 'cancelled',
    });
  });

  it('rejects truncated JSON even if its partial content happens to parse', async () => {
    const { model } = fixture({
      complete: async () => ({
        ...response,
        choices: [{ ...response.choices[0], finish_reason: 'length' }],
      }),
    });
    await expect(model.generate(input())).rejects.toBeInstanceOf(TingCompletionError);
  });

  it('never invents a reported provider model', async () => {
    const { model } = fixture({
      complete: async () => ({ choices: response.choices, usage: response.usage }),
    });
    await expect(model.generate(input())).resolves.toMatchObject({ reportedModelId: null });
  });
});
