import express from 'express';
import request from 'supertest';
import { Constants, FileSources, tingConfigSchema } from 'librechat-data-provider';
import type { TingAction, TingCatalogEntry } from 'librechat-data-provider';
import type { AppConfig, IUser } from '@librechat/data-schemas';
import type { Request } from 'express';
import {
  createTingAdmission,
  hasTingModelFreeAdmission,
  tingUserMessage,
  withTingEndpointOptions,
} from './native';
import { createTingModelGuard } from './capability';

const userId = 'unit-owner';
const procedure: TingCatalogEntry = {
  procedureId: '0387ad46-4cd6-40b7-be5a-296ef0812cd1',
  revisionId: '05be7e19-d104-49dd-9f3d-64c3dc52f17b',
  version: 1,
  title: 'Termin vereinbaren',
  description: 'Termin bei einer angebotenen Stelle vereinbaren.',
};
const action: TingAction = {
  type: 'select_procedure',
  procedureId: procedure.procedureId,
  revisionId: procedure.revisionId,
  requestId: '801b00c6-0c8a-42e5-b160-792093f3e18d',
};
type Dependencies = Parameters<typeof createTingAdmission>[0];

function app(deps: Partial<Dependencies> = {}) {
  const server = express();
  const guard = createTingModelGuard({ getOpenAIApiKey: () => undefined });
  server.use(express.json());
  server.use((request, _res, next) => {
    const req = request as Request & { config?: AppConfig; user?: IUser };
    req.user = { id: userId } as IUser;
    req.config = {
      config: {},
      ting: tingConfigSchema.parse({}),
      fileStrategy: FileSources.local,
      imageOutputType: 'png',
    };
    next();
  });
  server.post(
    '/',
    createTingAdmission({
      listPublishedTingProcedures: async () => [procedure],
      getMessages: async () => [],
      ...deps,
    }),
    (req, res, next) => {
      guard(req, res, next);
    },
    withTingEndpointOptions((_req, res) => {
      res.sendStatus(500);
    }),
    (req, res) => {
      const message = tingUserMessage(req, {
        messageId: req.body.messageId,
        conversationId: 'conversation-one',
        text: req.body.text,
      });
      res.json({
        text: req.body.text,
        clientRequestId: req.body.clientRequestId,
        responseMessageId: req.body.responseMessageId,
        userMessageId: message.messageId,
        operation: message.tingOperation,
        endpointOption: req.body.endpointOption,
        modelFree: hasTingModelFreeAdmission(req),
      });
    },
  );
  return server;
}

describe('TING native action admission', () => {
  it('starts only a server-resolved catalogue selection without initializing a model', async () => {
    const response = await request(app())
      .post('/')
      .send({ tingAction: action, text: 'forged title', parentMessageId: Constants.NO_PARENT });
    expect(response.status).toBe(200);
    expect(response.body.text).toBe('Termin vereinbaren');
    expect(response.body.modelFree).toBe(true);
    expect(response.body.endpointOption.model_parameters).toEqual({});
    expect(response.body.operation.action).toEqual(action);
  });

  it('gives transport retries the same native user and assistant identities', async () => {
    const server = app();
    const first = await request(server).post('/').send({ tingAction: action });
    const second = await request(server).post('/').send({ tingAction: action });
    expect(first.body.userMessageId).toBe(second.body.userMessageId);
    expect(first.body.responseMessageId).toBe(second.body.responseMessageId);
    expect(first.body.userMessageId).not.toBe(first.body.responseMessageId);
  });

  it('rejects a stale publication and cannot use it to bypass the key guard', async () => {
    const response = await request(app())
      .post('/')
      .send({ tingAction: { ...action, revisionId: '354df359-0ebf-4516-8493-bb189f246d98' } });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe('TING_STALE_ACTION');
  });

  it('rejects unknown action fields and forged server metadata', async () => {
    const forged = await request(app())
      .post('/')
      .send({ tingAction: { ...action, title: 'forged' } });
    const metadata = await request(app())
      .post('/')
      .send({ tingAction: action, tingIntake: { state: {} } });
    expect(forged.status).toBe(422);
    expect(metadata.status).toBe(422);
  });

  it('does not allow caller flags to bypass model availability for free text', async () => {
    const response = await request(app()).post('/').send({ text: 'Hello', modelFree: true });
    expect(response.status).toBe(503);
  });

  it('rejects request-id reuse with a different stored operation before starting any generation', async () => {
    const server = app({
      getMessages: async () => [
        {
          messageId: 'existing',
          conversationId: 'old',
          tingOperation: {
            requestId: action.requestId,
            action: { ...action, revisionId: 'other' },
            sourceParentMessageId: null,
          },
        },
      ],
    });
    const response = await request(server).post('/').send({ tingAction: action });
    expect(response.status).toBe(409);
  });
});
