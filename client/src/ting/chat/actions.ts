import type { TingReplyAction, TMessage } from 'librechat-data-provider';

/** Actions belong to one completed assistant turn on the visible branch. */
export function getTingReplyActions(
  message: TMessage,
  latestMessageId: string | null | undefined,
): TingReplyAction[] {
  if (
    message.messageId !== latestMessageId ||
    message.isCreatedByUser ||
    message.error ||
    message.unfinished
  ) {
    return [];
  }
  return message.tingIntake?.actions ?? [];
}
