import { ErrorTypes } from 'librechat-data-provider';
import { createTingModelGuard, resolveTingChatCapability } from './capability';

const configuredModel = {
  modelSpecs: {
    list: [
      {
        name: 'ting-chat',
        default: true,
        preset: { endpoint: 'openAI', model: 'gpt-test' },
      },
    ],
  },
};

describe('resolveTingChatCapability', () => {
  it('requires both a server credential and the loaded TING model spec', () => {
    expect(resolveTingChatCapability(configuredModel, {})).toEqual({
      status: 'not_configured',
    });
    expect(
      resolveTingChatCapability({ modelSpecs: { list: [] } }, { openAIApiKey: 'key' }),
    ).toEqual({ status: 'not_configured' });
    expect(resolveTingChatCapability(configuredModel, { openAIApiKey: 'key' })).toEqual({
      status: 'configured',
    });
  });

  it('does not accept a different, incomplete, or non-default model spec', () => {
    const candidates = [
      { name: 'other', default: true, preset: { endpoint: 'openAI', model: 'gpt-test' } },
      { name: 'ting-chat', default: false, preset: { endpoint: 'openAI', model: 'gpt-test' } },
      { name: 'ting-chat', default: true, preset: { endpoint: 'anthropic', model: 'gpt-test' } },
      { name: 'ting-chat', default: true, preset: { endpoint: 'openAI', model: ' ' } },
    ];

    expect(
      resolveTingChatCapability({ modelSpecs: { list: candidates } }, { openAIApiKey: 'key' }),
    ).toEqual({ status: 'not_configured' });
  });
});

describe('createTingModelGuard', () => {
  it('rejects an unconfigured generation before the controller runs', () => {
    const guard = createTingModelGuard({ getOpenAIApiKey: () => undefined });
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();

    guard({ config: configuredModel } as never, { status } as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      code: ErrorTypes.MODEL_NOT_CONFIGURED,
      message: 'TING kann gerade nicht antworten. Bitte versuchen Sie es später erneut.',
    });
  });

  it('continues when the configured model and credential are present', () => {
    const guard = createTingModelGuard({ getOpenAIApiKey: () => 'key' });
    const next = jest.fn();

    guard({ config: configuredModel } as never, {} as never, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
