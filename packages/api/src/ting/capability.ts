import { ErrorTypes } from 'librechat-data-provider';
import type { NextFunction, Request, Response } from 'express';

export const TING_MODEL_SPEC_NAME = 'ting-chat';

export type TingChatCapabilityStatus = 'configured' | 'not_configured';

export type TingChatCapability = {
  status: TingChatCapabilityStatus;
};

export type TingModelConfiguration = {
  modelSpecs?: {
    list?: Array<{
      name?: string;
      default?: boolean;
      preset?: {
        endpoint?: string;
        model?: string;
      };
    }>;
  } | null;
};

export type TingModelCredentials = {
  openAIApiKey?: string | null;
};

type TingChatRequest = Request & {
  config?: TingModelConfiguration;
};

type TingModelGuardDependencies = {
  getOpenAIApiKey: () => string | undefined;
};

const hasValue = (value?: string | null): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const resolveTingChatCapability = (
  config: TingModelConfiguration | null | undefined,
  credentials: TingModelCredentials,
): TingChatCapability => {
  if (!hasValue(credentials.openAIApiKey)) {
    return { status: 'not_configured' };
  }

  const modelSpec = config?.modelSpecs?.list?.find((candidate) => {
    const preset = candidate.preset;
    return (
      candidate.name === TING_MODEL_SPEC_NAME &&
      candidate.default === true &&
      preset?.endpoint === 'openAI' &&
      hasValue(preset.model)
    );
  });

  return { status: modelSpec == null ? 'not_configured' : 'configured' };
};

export const createTingModelGuard =
  ({ getOpenAIApiKey }: TingModelGuardDependencies) =>
  (req: TingChatRequest, res: Response, next: NextFunction): Response | void => {
    const capability = resolveTingChatCapability(req.config, {
      openAIApiKey: getOpenAIApiKey(),
    });
    if (capability.status === 'configured') {
      return next();
    }

    return res.status(503).json({
      code: ErrorTypes.MODEL_NOT_CONFIGURED,
      message: 'TING kann gerade nicht antworten. Bitte versuchen Sie es später erneut.',
    });
  };
