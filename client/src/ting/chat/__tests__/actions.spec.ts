import type { TMessage } from 'librechat-data-provider';
import { getTingReplyActions } from '../actions';

const reply = {
  id: 'reply-1',
  type: 'reply' as const,
  label: 'Zu Hause',
  text: 'Sie lebt zu Hause.',
};
const completed = {
  messageId: 'assistant-1',
  isCreatedByUser: false,
  unfinished: false,
  error: false,
  tingIntake: { schemaVersion: 'ting.intake.v1', actions: [reply] },
} as TMessage;

describe('TING reply availability', () => {
  it('exposes replies only on the current successful branch tail', () => {
    expect(getTingReplyActions(completed, 'assistant-1')).toEqual([reply]);
    expect(getTingReplyActions(completed, 'different-branch')).toEqual([]);
    expect(getTingReplyActions(completed, 'next-user-turn')).toEqual([]);
  });

  it('does not expose actions on failed, incomplete, or user-authored messages', () => {
    for (const change of [{ error: true }, { unfinished: true }, { isCreatedByUser: true }]) {
      expect(getTingReplyActions({ ...completed, ...change }, 'assistant-1')).toEqual([]);
    }
  });

  it('renders no action after procedure start or on legacy messages', () => {
    expect(getTingReplyActions({ ...completed, tingIntake: undefined }, 'assistant-1')).toEqual([]);
    expect(
      getTingReplyActions(
        { ...completed, tingIntake: { ...completed.tingIntake!, actions: [] } },
        'assistant-1',
      ),
    ).toEqual([]);
  });
});
