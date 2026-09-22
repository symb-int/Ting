import { v5 as uuidv5 } from 'uuid';
import { randomUUID } from 'node:crypto';
import {
  Constants,
  ContentTypes,
  EModelEndpoint,
  tingActionSchema,
  tingIntakeSchema,
  tingConfigSchema,
} from 'librechat-data-provider';
import type {
  TingAction,
  TingCatalogEntry,
  TingIntake,
  TingIntakeState,
  TingMatchRequest,
  TMessage,
  TEndpointOption,
} from 'librechat-data-provider';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AppConfig, IUser } from '@librechat/data-schemas';
import type { TingCompletionDependencies, TingModelUsage } from './completion';
import type { StructuredTokenUsage, TxMetadata } from '~/agents/transactions';
import { getBalanceConfig, getTransactionsConfig } from '~/app/config';
import { createTingCatalog, TingIntakeError } from './validation';
import { runTingIntakeTurn, startTingProcedure } from './intake';
import { createTingStructuredModel } from './completion';
import { TING_MODEL_SPEC_NAME } from './constants';
import { countTokens } from '~/utils/tokenizer';
import { createLlmMatcher } from './matcher';

type TingOperation = NonNullable<TingIntake['operation']>;
type StoredMessage = Omit<Partial<TMessage>, 'tingIntake'> & {
  messageId: string;
  conversationId: string;
  tingIntake?: TingIntake;
  tingOperation?: TingOperation;
};
type NativeRequest = Request & { config?: AppConfig; user?: IUser };
type NativeData = {
  listPublishedTingProcedures: () => Promise<TingCatalogEntry[]>;
  getMessages: (filter: {
    user: string;
    conversationId?: string;
    messageId?: string;
    tenantId?: string;
  }) => Promise<StoredMessage[]>;
};
type Admission = {
  action: TingAction;
  operation: TingOperation;
  catalogue: TingCatalogEntry[];
  selection?: TingCatalogEntry;
  replay?: StoredMessage;
};
const admissions = new WeakMap<Request, Admission>();
const ACTION_NAMESPACE = '9ad2a41e-1f9b-4a8c-9e84-d401f472ab9e';

function conflict(
  message = 'Diese Auswahl ist nicht mehr aktuell. Bitte laden Sie den Vorgang neu.',
) {
  return Object.assign(new Error(message), { status: 409, code: 'TING_STALE_ACTION' });
}

export function isTingNativeRequest(req: NativeRequest): boolean {
  return req.config?.ting != null;
}

export function hasTingModelFreeAdmission(req: Request): boolean {
  const admission = admissions.get(req);
  return admission?.selection != null || admission?.replay != null;
}

export function isTingAdmittedAction(req: Request): boolean {
  return admissions.has(req);
}

/** Resolve action text and identities before the native controller takes its immutable turn snapshot. */
export function createTingAdmission(deps: NativeData): RequestHandler {
  return async (request, res: Response, next: NextFunction) => {
    const req = request as NativeRequest;
    if (!isTingNativeRequest(req)) {
      if (req.body.tingAction != null) {
        res
          .status(422)
          .json({ code: 'TING_DISABLED', message: 'Die Auswahl ist nicht verfügbar.' });
        return;
      }
      next();
      return;
    }
    if (req.body.tingIntake != null || req.body.tingOperation != null) {
      res.status(422).json({ code: 'TING_SERVER_METADATA', message: 'Ungültige Nachricht.' });
      return;
    }
    if (req.body.tingAction == null) {
      next();
      return;
    }
    const parsed = tingActionSchema.safeParse(req.body.tingAction);
    if (
      !parsed.success ||
      req.body.editedContent ||
      req.body.isRegenerate ||
      req.body.isContinued ||
      req.body.compact ||
      req.body.overrideConvoId != null ||
      req.body.overrideParentMessageId != null
    ) {
      res.status(422).json({ code: 'TING_INVALID_ACTION', message: 'Ungültige Auswahl.' });
      return;
    }
    try {
      const action = parsed.data;
      const user = req.user?.id;
      if (!user) {
        res.status(401).json({ message: 'Bitte melden Sie sich an.' });
        return;
      }
      const userMessageId = uuidv5(`${user}:${action.requestId}:user`, ACTION_NAMESPACE);
      const responseMessageId = uuidv5(`${user}:${action.requestId}:assistant`, ACTION_NAMESPACE);
      const tenantId = req.user?.tenantId;
      const owner = { user, ...(tenantId ? { tenantId } : {}) };
      const parent = req.body.parentMessageId ?? Constants.NO_PARENT;
      const operation: TingOperation = {
        requestId: action.requestId,
        action,
        sourceParentMessageId: parent === Constants.NO_PARENT ? null : parent,
      };
      const [catalogue, existingUser] = await Promise.all([
        deps.listPublishedTingProcedures(),
        deps.getMessages({ ...owner, messageId: userMessageId }),
      ]);
      const storedUser = existingUser[0];
      if (
        storedUser &&
        req.body.conversationId &&
        req.body.conversationId !== Constants.NEW_CONVO &&
        req.body.conversationId !== storedUser.conversationId
      )
        throw conflict();
      if (storedUser && JSON.stringify(storedUser.tingOperation) !== JSON.stringify(operation)) {
        throw conflict('Diese Anfragekennung wurde bereits für eine andere Auswahl verwendet.');
      }
      const conversationId = storedUser?.conversationId ?? req.body.conversationId;
      const messages =
        conversationId && conversationId !== Constants.NEW_CONVO
          ? await deps.getMessages({ ...owner, conversationId })
          : [];
      const replay = messages.find(
        (message) =>
          message.messageId === responseMessageId &&
          !message.unfinished &&
          !message.error &&
          !message.isUserSubmitted &&
          message.tingIntake != null,
      );
      if (replay && JSON.stringify(replay.tingIntake?.operation) !== JSON.stringify(operation))
        throw conflict();
      let text: string;
      let selection: TingCatalogEntry | undefined;
      if (replay) {
        text = storedUser?.text ?? '';
      } else if (action.type === 'select_procedure') {
        selection = catalogue.find(
          (entry) =>
            entry.procedureId === action.procedureId && entry.revisionId === action.revisionId,
        );
        if (
          !selection ||
          parent !== Constants.NO_PARENT ||
          messages.some(
            (message) =>
              message.messageId !== userMessageId && message.messageId !== responseMessageId,
          )
        )
          throw conflict();
        text = selection.title;
      } else {
        const source = messages.find((message) => message.messageId === action.sourceMessageId);
        if (
          parent !== action.sourceMessageId ||
          !source ||
          source.isCreatedByUser ||
          source.isUserSubmitted ||
          source.error ||
          source.unfinished
        )
          throw conflict();
        const state = tingIntakeSchema.safeParse(source.tingIntake);
        const reply = state.success
          ? state.data.actions.find((option) => option.id === action.actionId)
          : null;
        if (
          !reply ||
          messages.some(
            (message) =>
              message.parentMessageId === source.messageId && message.messageId !== userMessageId,
          )
        )
          throw conflict();
        text = reply.text;
      }
      admissions.set(req, { action, operation, catalogue, selection, replay });
      req.body.text = text;
      req.body.clientRequestId = action.requestId;
      req.body.messageId = userMessageId;
      req.body.overrideUserMessageId = `${userMessageId}${Constants.COMMON_DIVIDER}0`;
      req.body.responseMessageId = responseMessageId;
      if (storedUser) {
        if (req.body.conversationId !== storedUser.conversationId) {
          delete (req as NativeRequest & { resolvedConversation?: object | null })
            .resolvedConversation;
        }
        req.body.conversationId = storedUser.conversationId;
      }
      next();
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 409) {
        res.status(409).json({ code: 'TING_STALE_ACTION', message: error.message });
        return;
      }
      next(error);
    }
  };
}

export function withTingEndpointOptions(fallback: RequestHandler): RequestHandler {
  return (request, res, next) => {
    const req = request as NativeRequest;
    if (!isTingNativeRequest(req)) return fallback(req, res, next);
    const model = req.config?.modelSpecs?.list?.find((entry) => entry.name === TING_MODEL_SPEC_NAME)
      ?.preset?.model;
    req.body.endpointOption = {
      endpoint: EModelEndpoint.openAI,
      spec: TING_MODEL_SPEC_NAME,
      model_parameters: { ...(model ? { model } : {}) },
    };
    next();
  };
}

type NativeOptions = {
  req: NativeRequest;
  endpoint: EModelEndpoint;
  spec: string;
  resendFiles: false;
  titleConvo: boolean;
  endpointOption: Partial<TEndpointOption>;
  deps: NativeData & {
    createModel: (
      modelId: string,
      onUsage: (usage: TingModelUsage) => Promise<void>,
    ) => Omit<
      TingCompletionDependencies,
      'configuredModelId' | 'timeoutMs' | 'maxInputTokens' | 'maxOutputTokens'
    >;
    recordUsage: (
      usage: TingModelUsage,
      context: { user: string; conversationId: string; messageId: string; config?: AppConfig },
    ) => Promise<void>;
  };
};
type NativeHost = {
  options: NativeOptions;
  model?: string;
  modelOptions?: { model?: string };
  sender: string;
  clientName: EModelEndpoint;
  conversationId: string;
  responseMessageId: string;
  currentMessages: StoredMessage[];
  contentParts: Array<{ type: ContentTypes.TEXT; text: string }>;
  metadata?: { tingIntake: TingIntake; error?: false; tokenCount?: number; promptTokens?: number };
  abortController: AbortController;
  tingMessages?: TingMatchRequest['messages'];
  tingPriorState?: TingIntakeState;
  tingCatalogue?: TingCatalogEntry[];
};

export function initializeTingClient(host: NativeHost, options: NativeOptions): void {
  host.options = {
    ...options,
    endpoint: EModelEndpoint.openAI,
    spec: TING_MODEL_SPEC_NAME,
    resendFiles: false,
    titleConvo: true,
  };
  host.model =
    options.req.config?.modelSpecs?.list?.find((entry) => entry.name === TING_MODEL_SPEC_NAME)
      ?.preset?.model ?? undefined;
  host.modelOptions = { model: host.model };
  host.sender = 'TING';
  host.clientName = EModelEndpoint.agents;
  host.contentParts = [];
}

export function tingSaveOptions(host: NativeHost): {
  endpoint: EModelEndpoint;
  model?: string;
  spec: string;
} {
  return { endpoint: host.options.endpoint, model: host.model, spec: TING_MODEL_SPEC_NAME };
}

export function tingUserMessage(req: Request, message: StoredMessage): StoredMessage;
export function tingUserMessage(
  req: Request,
  message: StoredMessage | null | undefined,
): StoredMessage | null | undefined;
export function tingUserMessage(
  req: Request,
  message: StoredMessage | null | undefined,
): StoredMessage | null | undefined {
  const admission = admissions.get(req);
  return admission && message ? { ...message, tingOperation: admission.operation } : message;
}

function storedMessageText(message: StoredMessage): string {
  return (
    message.text ||
    (message.content ?? [])
      .map((part) => {
        if (part.type !== ContentTypes.TEXT) return '';
        return typeof part.text === 'string' ? part.text : (part.text?.value ?? '');
      })
      .join('\n')
  );
}

export async function buildTingMessages(
  host: NativeHost,
  messages: StoredMessage[],
): Promise<{
  prompt: Array<{ role: 'user' | 'assistant'; content: string }>;
  promptTokens: number;
}> {
  let priorState: TingIntakeState = { concerns: [], focusConcernId: null };
  const turns: TingMatchRequest['messages'] = [];
  for (const message of messages) {
    if (!message.error && !message.unfinished) {
      const text = storedMessageText(message);
      turns.push({
        messageId: message.messageId,
        role: message.isCreatedByUser ? 'user' : 'assistant',
        text,
      });
      if (
        !message.isCreatedByUser &&
        !message.isUserSubmitted &&
        !message.userSubmittedPaths?.length
      ) {
        const parsed = tingIntakeSchema.safeParse(message.tingIntake);
        if (parsed.success) priorState = parsed.data.state;
      }
    }
  }
  host.tingMessages = turns;
  host.tingPriorState = priorState;
  const admission = admissions.get(host.options.req);
  host.tingCatalogue =
    admission?.catalogue ?? (await host.options.deps.listPublishedTingProcedures());
  return {
    prompt: turns.map((turn) => ({ role: turn.role, content: turn.text })),
    promptTokens: hasTingModelFreeAdmission(host.options.req)
      ? 0
      : await countTokens(JSON.stringify({ turns, priorState, catalog: host.tingCatalogue })),
  };
}

export async function sendTingCompletion(
  host: NativeHost,
): Promise<{ completion: NativeHost['contentParts'] }> {
  const req = host.options.req;
  const admission = admissions.get(req);
  const signal = host.abortController.signal;
  signal.throwIfAborted();
  const current = host.tingMessages?.[host.tingMessages.length - 1];
  if (!current || current.role !== 'user')
    throw new TingIntakeError(
      'invalid_output',
      'Der aktuelle Beitrag konnte nicht gelesen werden.',
    );
  const priorState = host.tingPriorState ?? { concerns: [], focusConcernId: null };
  if (admission && !admission.replay) {
    const currentRows = await host.options.deps.getMessages({
      user: req.user!.id,
      conversationId: host.conversationId,
      ...(req.user?.tenantId ? { tenantId: req.user.tenantId } : {}),
    });
    const siblings = currentRows.filter(
      (message) =>
        message.messageId !== current.messageId && message.messageId !== host.responseMessageId,
    );
    const currentAction = admission.action;
    if (
      currentAction.type === 'select_procedure'
        ? siblings.length > 0
        : siblings.some((message) => message.parentMessageId === currentAction.sourceMessageId)
    )
      throw conflict();
  }
  let result: { reply: string; tingIntake: TingIntake };
  if (admission?.replay?.tingIntake) {
    result = {
      reply: storedMessageText(admission.replay),
      tingIntake: admission.replay.tingIntake,
    };
  } else if (admission?.selection) {
    const live = await host.options.deps.listPublishedTingProcedures();
    const procedure = live.find(
      (entry) =>
        entry.procedureId === admission.selection?.procedureId &&
        entry.revisionId === admission.selection?.revisionId,
    );
    if (!procedure) throw conflict();
    result = startTingProcedure({
      procedure,
      state: priorState,
      requestId: admission.action.requestId,
      currentMessageId: current.messageId,
    });
  } else {
    const config = tingConfigSchema.parse(req.config?.ting);
    if (config.matcher.implementation !== 'llm' || !host.model)
      throw new TingIntakeError(
        'configuration',
        'Die Anliegenklärung ist derzeit nicht verfügbar.',
      );
    const usage: TingModelUsage[] = [];
    const model = createTingStructuredModel({
      ...host.options.deps.createModel(host.model, async (entry) => {
        usage.push(entry);
        await host.options.deps.recordUsage(entry, {
          user: req.user!.id,
          conversationId: host.conversationId,
          messageId: host.responseMessageId,
          config: req.config,
        });
      }),
      configuredModelId: host.model,
      ...config.model,
    });
    const catalogue = host.tingCatalogue ?? (await host.options.deps.listPublishedTingProcedures());
    const parent = host.currentMessages.find(
      (message) => message.messageId === current.messageId,
    )?.parentMessageId;
    const request: TingMatchRequest = {
      contractVersion: 'ting.matcher.v1',
      requestId: randomUUID(),
      conversationId: host.conversationId,
      parentMessageId: parent === Constants.NO_PARENT ? null : (parent ?? null),
      currentMessageId: current.messageId,
      locale: 'de-DE',
      messages: host.tingMessages!,
      priorConcerns: priorState.concerns.map((concern) => ({
        id: concern.id,
        summary: concern.summary,
        evidence: concern.evidence,
        procedure: concern.procedure
          ? { procedureId: concern.procedure.procedureId, revisionId: concern.procedure.revisionId }
          : null,
      })),
      catalog: createTingCatalog(catalogue),
    };
    result = await runTingIntakeTurn({
      request,
      priorState,
      matcher: createLlmMatcher({ model, configuredModelId: host.model }),
      model,
      signal,
    });
    host.metadata = {
      tingIntake: result.tingIntake,
      ...(usage.length === 2
        ? {
            tokenCount: usage.reduce((total, entry) => total + entry.completionTokens, 0),
            promptTokens: usage.reduce((total, entry) => total + entry.promptTokens, 0),
          }
        : {}),
    };
  }
  signal.throwIfAborted();
  const tingIntake = tingIntakeSchema.parse({
    ...result.tingIntake,
    ...(admission ? { operation: admission.operation } : {}),
  });
  host.metadata = { ...host.metadata, tingIntake, error: false };
  host.contentParts.push({ type: ContentTypes.TEXT, text: result.reply });
  return { completion: host.contentParts };
}

export function tingConversationTitle(host: NativeHost): string {
  const state = host.metadata?.tingIntake.state;
  return (
    state?.concerns.find((concern) => concern.id === state.focusConcernId)?.procedure?.title ??
    admissions.get(host.options.req)?.selection?.title ??
    host.tingMessages?.find((message) => message.role === 'user')?.text.slice(0, 80) ??
    host.options.req.body.text?.slice(0, 80) ??
    'Neuer Vorgang'
  );
}

/** Persist a newly started procedure title through BaseClient's existing conversation write. */
export function tingConversationSaveOptions<T extends object>(
  host: NativeHost,
  options: T,
  message: { isCreatedByUser?: boolean },
): T & { title?: string } {
  if (message.isCreatedByUser) return options;
  const state = host.metadata?.tingIntake.state;
  const current = state?.concerns.find((concern) => concern.id === state.focusConcernId);
  const previous = host.tingPriorState?.concerns.find((concern) => concern.id === current?.id);
  if (
    current?.assessment !== 'started' ||
    !current.procedure ||
    (previous?.assessment === 'started' &&
      previous.procedure?.procedureId === current.procedure.procedureId &&
      previous.procedure.revisionId === current.procedure.revisionId)
  )
    return options;
  return { ...options, title: current.procedure.title };
}

export function withTingInitializer<T, P extends { req: NativeRequest }>(
  fallback: (params: P) => Promise<T>,
  initialize: (params: P) => Promise<T>,
): (params: P) => Promise<T> {
  return (params: P): Promise<T> =>
    isTingNativeRequest(params.req) ? initialize(params) : fallback(params);
}

export async function recordTingUsage(
  spend: (metadata: TxMetadata, usage: StructuredTokenUsage) => Promise<unknown>,
  usage: TingModelUsage,
  context: { user: string; conversationId: string; messageId: string; config?: AppConfig },
): Promise<void> {
  await spend(
    {
      user: context.user,
      conversationId: context.conversationId,
      messageId: context.messageId,
      model: usage.configuredModelId,
      context: 'message',
      balance: getBalanceConfig(context.config),
      transactions: getTransactionsConfig(context.config),
    },
    {
      promptTokens: { input: usage.promptTokens - usage.cachedTokens, read: usage.cachedTokens },
      completionTokens: usage.completionTokens,
    },
  );
}
