import React, { forwardRef } from 'react';
import { useWatch } from 'react-hook-form';
import { composerSubmitClasses, SendIcon, TooltipAnchor } from '@librechat/client';
import type { Control } from 'react-hook-form';
import { isSubmittableMessage } from '~/utils';
import { useLocalize } from '~/hooks';

type SendButtonProps = {
  disabled: boolean;
  control: Control<{ text: string }>;
  /** Number of attached files; attachments allow sending without text */
  fileCount?: number;
};

const SubmitButton = React.memo(
  forwardRef((props: { disabled: boolean }, ref: React.ForwardedRef<HTMLButtonElement>) => {
    const localize = useLocalize();
    return (
      <TooltipAnchor
        description={localize('com_ting_send')}
        render={
          <button
            ref={ref}
            aria-label={localize('com_ting_send')}
            id="send-button"
            disabled={props.disabled}
            className={`${composerSubmitClasses()} ting-composer-submit`}
            data-testid="send-button"
            type="submit"
          >
            <span className="" data-state="closed">
              <SendIcon className="text-text-on-status" size={17} />
            </span>
          </button>
        }
      />
    );
  }),
);

const SendButton = React.memo(
  forwardRef((props: SendButtonProps, ref: React.ForwardedRef<HTMLButtonElement>) => {
    const data = useWatch({ control: props.control });
    const canSubmit = isSubmittableMessage(data?.text, props.fileCount);
    return <SubmitButton ref={ref} disabled={props.disabled || !canSubmit} />;
  }),
);

export default SendButton;
