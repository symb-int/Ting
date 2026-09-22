import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { TingIntake } from 'librechat-data-provider';
import { CLIENT_MESSAGE_SELECT, createMessageMethods } from './message';
import { createModels } from '../models';

describe('TING message metadata trust boundary', () => {
  let database: MongoMemoryServer;
  let methods: ReturnType<typeof createMessageMethods>;
  const userId = 'ting-citizen';
  const procedure = {
    procedureId: randomUUID(),
    revisionId: randomUUID(),
    version: 1,
    title: 'Testverfahren',
    description: 'Ein Testverfahren.',
  };
  const requestId = randomUUID();
  const intake: TingIntake = {
    schemaVersion: 'ting.intake.v1',
    state: { concerns: [], focusConcernId: null },
    actions: [{ id: 'reply-1', type: 'reply', label: 'Antwort', text: 'Meine Antwort' }],
    audit: { mode: 'selection', requestId, currentMessageId: 'user-message', procedure },
    operation: {
      requestId,
      sourceParentMessageId: null,
      action: {
        type: 'select_procedure',
        procedureId: procedure.procedureId,
        revisionId: procedure.revisionId,
        requestId,
      },
    },
  };

  beforeAll(async () => {
    database = await MongoMemoryServer.create({ instance: { args: ['--nounixsocket'] } });
    createModels(mongoose);
    await mongoose.connect(database.getUri());
    methods = createMessageMethods(mongoose);
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await database.stop();
  });
  afterEach(async () => {
    await mongoose.models.Message.deleteMany({});
  });

  const row = () => ({
    messageId: randomUUID(),
    conversationId: randomUUID(),
    user: userId,
    text: 'Wir beginnen.',
    isCreatedByUser: false,
    tingIntake: intake,
    tingOperation: intake.operation,
  });

  it('persists internal evidence but returns only public state and actions to the client', async () => {
    const message = row();
    await methods.saveMessage({ userId }, message);
    const [internal] = await methods.getMessages({ user: userId, messageId: message.messageId });
    expect(internal.tingIntake).toEqual(intake);
    expect(internal.tingOperation).toEqual(intake.operation);
    const [visible] = await methods.getMessages(
      { user: userId, messageId: message.messageId },
      CLIENT_MESSAGE_SELECT,
    );
    expect(visible.tingIntake).toEqual({
      schemaVersion: intake.schemaVersion,
      state: intake.state,
      actions: intake.actions,
    });
    expect(visible).not.toHaveProperty('tingOperation');
  });

  it('rejects forged metadata from the client-create path including dotted update fields', async () => {
    const message = row();
    const forged = {
      ...message,
      isUserSubmitted: true,
      'tingIntake.audit': intake.audit,
      'tingOperation.requestId': requestId,
    };
    await methods.saveMessage({ userId }, forged);
    const [stored] = await methods.getMessages({ user: userId, messageId: message.messageId });
    expect(stored).not.toHaveProperty('tingIntake');
    expect(stored).not.toHaveProperty('tingOperation');
  });

  it('drops metadata on import and fork even if an import claims server provenance', async () => {
    const message = row();
    await methods.bulkSaveMessages([{ ...message, isUserSubmitted: false }]);
    const [stored] = await methods.getMessages({ user: userId, messageId: message.messageId });
    expect(stored).not.toHaveProperty('tingIntake');
    expect(stored).not.toHaveProperty('tingOperation');
  });

  it('atomically invalidates prior intake and receipts when the message is edited', async () => {
    const message = row();
    await methods.saveMessage({ userId }, message);
    await methods.updateMessage(userId, {
      messageId: message.messageId,
      text: 'Geänderte Nachricht',
      userSubmittedPaths: ['/text'],
      tingIntake: intake,
    });
    const [stored] = await methods.getMessages({ user: userId, messageId: message.messageId });
    expect(stored.text).toBe('Geänderte Nachricht');
    expect(stored).not.toHaveProperty('tingIntake');
    expect(stored).not.toHaveProperty('tingOperation');
  });

  it('preserves intake when a citizen adds feedback without changing its content', async () => {
    const message = row();
    await methods.saveMessage({ userId }, message);
    await methods.updateMessage(userId, {
      messageId: message.messageId,
      feedback: { rating: 'thumbsUp', tag: undefined },
    });
    const [stored] = await methods.getMessages({ user: userId, messageId: message.messageId });
    expect(stored.tingIntake).toEqual(intake);
  });

  it.each(['updateMessage', 'updateMessageText'] as const)(
    'invalidates prior metadata through %s even without caller provenance markers',
    async (method) => {
      const message = row();
      await methods.saveMessage({ userId }, message);
      await methods[method](userId, { messageId: message.messageId, text: 'Bearbeitet' });
      const [stored] = await methods.getMessages({ user: userId, messageId: message.messageId });
      expect(stored.text).toBe('Bearbeitet');
      expect(stored).not.toHaveProperty('tingIntake');
      expect(stored).not.toHaveProperty('tingOperation');
    },
  );
});
