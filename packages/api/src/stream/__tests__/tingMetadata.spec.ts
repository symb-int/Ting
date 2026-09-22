import { randomUUID } from 'node:crypto';
import type { TingIntake } from 'librechat-data-provider';
import type { ServerSentEvent } from '~/types';
import { GenerationJobManagerClass } from '../GenerationJobManager';
import { createStreamServices } from '../createStreamServices';

describe('TING stream metadata privacy', () => {
  let manager: GenerationJobManagerClass;
  const requestId = randomUUID();
  const operation: NonNullable<TingIntake['operation']> = {
    requestId,
    sourceParentMessageId: null,
    action: {
      type: 'select_procedure',
      requestId,
      procedureId: randomUUID(),
      revisionId: randomUUID(),
    },
  };

  beforeEach(() => {
    manager = new GenerationJobManagerClass();
    manager.configure(createStreamServices({ useRedis: false }));
    manager.initialize();
  });
  afterEach(async () => {
    await manager.destroy();
  });

  it('retains the action receipt internally across created publication but excludes it from live, replay and resume payloads', async () => {
    const streamId = randomUUID();
    const message = {
      messageId: randomUUID(),
      conversationId: streamId,
      parentMessageId: randomUUID(),
      text: 'Ein Verfahren beginnen',
      isCreatedByUser: true,
      sender: 'User',
      tingOperation: operation,
    };
    await manager.createJob(streamId, 'citizen', streamId, {
      initialMetadata: { userMessage: message },
    });
    const events: ServerSentEvent[] = [];
    const live = await manager.subscribe(streamId, (event) => events.push(event));
    await manager.emitChunk(streamId, { created: true, message, streamId });

    const job = await manager.getJob(streamId);
    expect(job?.metadata.userMessage).toHaveProperty('tingOperation', operation);
    const created = events.find((event) => 'created' in event);
    expect(created).toBeDefined();
    expect(created).not.toHaveProperty('message.tingOperation');
    const resumed = await manager.getResumeState(streamId);
    expect(resumed?.userMessage?.messageId).toBe(message.messageId);
    expect(resumed?.userMessage).not.toHaveProperty('tingOperation');
    live?.unsubscribe();
  });

  it('sanitizes buffered created messages before a late subscriber can replay them', async () => {
    const streamId = randomUUID();
    const message = {
      messageId: randomUUID(),
      conversationId: streamId,
      text: 'Start',
      isCreatedByUser: true,
      tingOperation: operation,
      sender: 'User',
    };
    await manager.createJob(streamId, 'citizen');
    await manager.emitChunk(streamId, { created: true, message, streamId });
    const events: ServerSentEvent[] = [];
    const subscription = await manager.subscribe(streamId, (event) => events.push(event));
    const created = events.find((event) => 'created' in event);
    expect(created).toBeDefined();
    expect(created).not.toHaveProperty('message.tingOperation');
    subscription?.unsubscribe();
  });
});
