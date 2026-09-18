import { useRef } from 'react';
import { X } from 'lucide-react';
import {
  OGDialog,
  OGDialogClose,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
} from '@librechat/client';
import type { RefObject } from 'react';
import ArchivedChatsTable from './ArchivedChatsTable';
import { TingIconButton } from '~/ting';
import { useLocalize } from '~/hooks';

export function ArchivedChatsModal({
  open,
  onOpenChange,
  triggerRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: RefObject<HTMLButtonElement | HTMLDivElement | null>;
}) {
  const localize = useLocalize();
  const contentRef = useRef<HTMLDivElement>(null);

  /** The virtualized table has no stable focusable on mount, so Radix's default
   *  autofocus lands on a row that the virtualizer tears out, dropping focus to
   *  the page's top focus guard; anchor focus to the dialog content instead.
   *  The container is only a landing spot for focus, never a tab stop, so it
   *  draws no focus ring of its own; the first Tab reveals one on a real control. */
  const handleOpenAutoFocus = (event: Event) => {
    event.preventDefault();
    contentRef.current?.focus();
  };

  return (
    <OGDialog open={open} onOpenChange={onOpenChange} triggerRef={triggerRef}>
      <OGDialogContent
        ref={contentRef}
        tabIndex={-1}
        showCloseButton={false}
        onOpenAutoFocus={handleOpenAutoFocus}
        overlayClassName="ting-dialog-backdrop"
        className="dialog focus:outline-none"
      >
        <OGDialogHeader className="dialog__head">
          <OGDialogTitle>{localize('com_ting_archived_cases')}</OGDialogTitle>
          <OGDialogClose asChild>
            <TingIconButton
              variant="quiet"
              label={localize('com_ui_close')}
              aria-label={localize('com_ui_close')}
            >
              <X aria-hidden="true" />
            </TingIconButton>
          </OGDialogClose>
        </OGDialogHeader>
        <div className="dialog__body">
          <ArchivedChatsTable />
        </div>
      </OGDialogContent>
    </OGDialog>
  );
}
