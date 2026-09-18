import { lazy, memo, Suspense, useCallback, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import type { ChatFormValues } from '~/common';
import { MOBILE_DRAWER_ID, MOBILE_DRAWER_TRANSITION, DRAWER_Z_INDEX } from './constants';
import { CLOSE_SIDEBAR_ID } from '~/components/Chat/Menus/OpenSidebar';
import { useChatHelpers, useFocusTrap, useLocalize } from '~/hooks';
import { ChatContext, ChatFormProvider } from '~/Providers';
import useSidebarToggle from '~/hooks/Nav/useSidebarToggle';
import ConversationsSection from './ConversationsSection';
import useSidebarState from '~/hooks/Nav/useSidebarState';
import SearchBar from '~/components/Nav/SearchBar';
import useNewChat from '~/hooks/Chat/useNewChat';
import { TingButton } from '~/ting';
import { cn } from '~/utils';

const AccountSettings = lazy(() => import('~/components/Nav/AccountSettings'));

function SidebarChatProvider({ children }: { children: ReactNode }) {
  const chatHelpers = useChatHelpers(0);
  const sidebarFormMethods = useForm<ChatFormValues>({ defaultValues: { text: '' } });

  return (
    <ChatFormProvider {...sidebarFormMethods}>
      <ChatContext.Provider value={chatHelpers}>{children}</ChatContext.Provider>
    </ChatFormProvider>
  );
}

function SidebarContents({
  isSmallScreen,
  expanded,
  onClose,
}: {
  isSmallScreen: boolean;
  expanded: boolean;
  onClose: () => void;
}) {
  const localize = useLocalize();
  const { handleNewChatClick } = useNewChat({ onNewChat: isSmallScreen ? onClose : undefined });

  return (
    <SidebarChatProvider>
      <div className="ting-sidebar__brand-row">
        <a
          href="/c/new"
          className="ting-sidebar__wordmark"
          onClick={handleNewChatClick}
          aria-label={localize('com_ting_new_case')}
        >
          TING
        </a>
        {isSmallScreen && (
          <button
            id={expanded ? CLOSE_SIDEBAR_ID : undefined}
            type="button"
            className="ting-sidebar__close"
            aria-label={localize('com_nav_close_sidebar')}
            aria-expanded={expanded}
            aria-controls="chat-history-nav"
            tabIndex={expanded ? 0 : -1}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="ting-sidebar__actions">
        <TingButton asChild size="navigation" className="ting-sidebar__new-case w-full">
          <a href="/c/new" data-testid="new-chat-button" onClick={handleNewChatClick}>
            <Plus aria-hidden="true" />
            <span>{localize('com_ting_new_case')}</span>
          </a>
        </TingButton>
        <SearchBar isSmallScreen={isSmallScreen} />
      </div>

      <nav id="chat-history-nav" className="ting-sidebar__history">
        <ConversationsSection />
      </nav>

      <div className="ting-sidebar__account">
        <Suspense fallback={<div className="ting-sidebar__account-skeleton" aria-hidden="true" />}>
          <AccountSettings />
        </Suspense>
      </div>
    </SidebarChatProvider>
  );
}

function UnifiedSidebar() {
  const localize = useLocalize();
  const { isSmallScreen, expanded } = useSidebarState();
  const { setSidebarOpen } = useSidebarToggle();
  const drawerRef = useRef<HTMLElement>(null);

  const handleClose = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  useFocusTrap(drawerRef, isSmallScreen && expanded, handleClose);

  if (isSmallScreen) {
    return (
      <aside
        ref={drawerRef}
        id={MOBILE_DRAWER_ID}
        role="dialog"
        aria-modal={expanded || undefined}
        aria-label={localize('com_ui_chat_history')}
        className={cn('ting-sidebar ting-sidebar--drawer', expanded && 'ting-sidebar--open')}
        style={{
          transition: MOBILE_DRAWER_TRANSITION,
          zIndex: DRAWER_Z_INDEX,
        }}
        inert={!expanded ? '' : undefined}
      >
        <SidebarContents isSmallScreen expanded={expanded} onClose={handleClose} />
      </aside>
    );
  }

  return (
    <aside className="ting-sidebar" aria-label={localize('com_ui_chat_history')}>
      <SidebarContents isSmallScreen={false} expanded onClose={handleClose} />
    </aside>
  );
}

export default memo(UnifiedSidebar);
