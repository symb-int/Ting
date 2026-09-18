import React from 'react';
import type { TOptions } from 'i18next';
import type { TranslationKeys } from '~/hooks/useLocalize';
import { cn } from '~/utils';

interface ConvoLinkProps {
  isActiveConvo: boolean;
  isPopoverActive: boolean;
  isSharedBadgeVisible: boolean;
  title: string | null;
  onRename: () => void;
  isSmallScreen: boolean;
  localize: (key: TranslationKeys, options?: TOptions) => string;
  /** Shortcuts the row responds to, declared on the element that takes focus so
   *  assistive tech announces them when the user arrives here. */
  keyShortcuts?: string;
  children: React.ReactNode;
}

const ConvoLink: React.FC<ConvoLinkProps> = ({
  isActiveConvo,
  isPopoverActive,
  isSharedBadgeVisible,
  title,
  onRename,
  isSmallScreen,
  localize,
  keyShortcuts,
  children,
}) => {
  const displayTitle = title || localize('com_ui_untitled');

  return (
    <button
      type="button"
      className={cn(
        'flex w-full min-w-0 grow cursor-pointer items-center gap-2 overflow-hidden rounded-lg px-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-text-primary',
        isActiveConvo || isPopoverActive ? 'bg-surface-active-alt' : '',
      )}
      aria-current={isActiveConvo ? 'page' : undefined}
      aria-keyshortcuts={keyShortcuts}
      aria-label={
        isSharedBadgeVisible
          ? localize('com_ui_conversation_label_shared', {
              title: title || localize('com_ui_untitled'),
            })
          : localize('com_ui_conversation_label', {
              title: title || localize('com_ui_untitled'),
            })
      }
    >
      {children}
      <span
        className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap [text-align:start]"
        onDoubleClick={(e) => {
          if (isSmallScreen) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          onRename();
        }}
      >
        {displayTitle}
      </span>
    </button>
  );
};

export default ConvoLink;
