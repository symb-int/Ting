import { memo } from 'react';
import type { ReactNode } from 'react';
import { useLocalize } from '~/hooks';

/**
 * Re-attributes response content to its author mid-message. A `SteerPart`
 * renders a full user turn inside the response, so the parts that resume
 * after it need the author's icon and label restated. The message-level
 * header only renders once, above the first part. Sits on the same left
 * edge as the message body.
 */
const AuthorHeader = memo(function AuthorHeader({
  icon: _icon,
  label: _label,
}: {
  icon: ReactNode;
  label: string;
}) {
  const localize = useLocalize();
  return (
    <div
      className="ting-agent-header relative flex w-full items-center"
      data-testid="author-header"
    >
      <div className="ting-agent-mark" aria-hidden="true">
        T
      </div>
      <h2 className="min-w-0 select-none truncate font-bold text-text-primary">
        {localize('com_ting_name')}
      </h2>
      <span className="ting-agent-scope">{localize('com_ting_private_with_you')}</span>
    </div>
  );
});

export default AuthorHeader;
