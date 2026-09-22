import type { TMessage } from 'librechat-data-provider';
import { TingButton, TingStatus } from '../components';
import useTingActionSubmission from './useSubmission';
import { getTingReplyActions } from './actions';
import { useLocalize } from '~/hooks';

export default function TingReplies({
  message,
  latestMessageId,
}: {
  message: TMessage;
  latestMessageId: string | null | undefined;
}) {
  const localize = useLocalize();
  const { submit, pending, submissionError, showCapabilityError } = useTingActionSubmission();
  const actions = getTingReplyActions(message, latestMessageId);

  if (!actions.length) {
    return null;
  }
  return (
    <div className="ting-intake-message-actions">
      <div
        className="ting-intake-replies"
        role="group"
        aria-label={localize('com_ting_answer_options')}
      >
        {actions.map((action) => (
          <TingButton
            key={action.id}
            variant="secondary"
            disabled={pending}
            onClick={() =>
              submit(
                { type: 'reply', actionId: action.id, sourceMessageId: message.messageId },
                action.text,
              )
            }
          >
            {action.label}
          </TingButton>
        ))}
      </div>
      {(submissionError || showCapabilityError) && (
        <TingStatus variant="error" role="alert">
          {localize(showCapabilityError ? 'com_ting_response_error' : 'com_ting_action_error')}
        </TingStatus>
      )}
    </div>
  );
}
