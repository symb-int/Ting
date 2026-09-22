import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 } from 'uuid';
import type { TingAction } from 'librechat-data-provider';
import { useGetLatestMessage } from '~/hooks/Messages/useLatestMessage';
import useChatCapabilityGuard from '../hooks/useChatCapabilityGuard';
import { useChatContext } from '~/Providers';

type ActionInput =
  | Omit<Extract<TingAction, { type: 'reply' }>, 'requestId'>
  | Omit<Extract<TingAction, { type: 'select_procedure' }>, 'requestId'>;

export default function useTingActionSubmission() {
  const { ask, index, isSubmitting, conversation } = useChatContext();
  const getLatestMessage = useGetLatestMessage(index);
  const { requireChatCapability, showCapabilityError } = useChatCapabilityGuard(
    conversation?.conversationId ?? '',
  );
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);

  useEffect(() => {
    if (!isSubmitting) {
      inFlight.current = false;
      setPending(false);
    }
  }, [isSubmitting, conversation?.conversationId]);

  const submit = useCallback(
    (action: ActionInput, displayText: string) => {
      if (isSubmitting || inFlight.current) {
        return false;
      }
      const latest = getLatestMessage();
      if (
        (action.type === 'reply' && latest?.messageId !== action.sourceMessageId) ||
        (action.type === 'select_procedure' && latest != null)
      ) {
        setSubmissionError(true);
        return false;
      }
      if (action.type === 'reply' && !requireChatCapability()) {
        return false;
      }

      inFlight.current = true;
      setPending(true);
      setSubmissionError(false);
      const requestId = v4();
      try {
        const result = ask(
          {
            text: displayText,
            ...(action.type === 'reply' && { parentMessageId: action.sourceMessageId }),
          },
          {
            tingAction: { ...action, requestId },
            overrideClientRequestId: requestId,
            // Clicking a reply does not send or clear the separate composer draft.
            overrideFiles: [],
            overrideQuotes: [],
            overrideManualSkills: [],
          },
        );
        if (result !== false) {
          return true;
        }
      } catch {
        // The native submission path owns network errors; this is a local admission failure.
      }
      inFlight.current = false;
      setPending(false);
      setSubmissionError(true);
      return false;
    },
    [ask, getLatestMessage, isSubmitting, requireChatCapability],
  );

  return {
    submit,
    pending: pending || isSubmitting,
    submissionError,
    showCapabilityError,
  };
}
