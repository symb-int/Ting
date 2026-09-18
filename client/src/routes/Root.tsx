import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useMediaQuery } from '@librechat/client';
import {
  PromptGroupsProvider,
  AssistantsMapContext,
  AgentsMapContext,
  SetConvoProvider,
  FileMapContext,
} from '~/Providers';
import {
  useSearchEnabled,
  useAssistantsMap,
  useAuthContext,
  useCatalogWarmup,
  useAgentsMap,
  useFileMap,
} from '~/hooks';
import KeyboardShortcutsDialog from '~/components/Nav/KeyboardShortcutsDialog';
import KeyboardDeleteDialog from '~/components/Nav/KeyboardDeleteDialog';
import { useUserTermsQuery, useGetStartupConfig } from '~/data-provider';
import { MobileDrawerScrim } from '~/components/UnifiedSidebar/mobile';
import useKeyboardShortcuts from '~/hooks/useKeyboardShortcuts';
import { UnifiedSidebar } from '~/components/UnifiedSidebar';
import useDrawerDismiss from '~/hooks/Nav/useDrawerDismiss';
import useSidebarToggle from '~/hooks/Nav/useSidebarToggle';
import useSidebarState from '~/hooks/Nav/useSidebarState';
import { TermsAndConditionsModal } from '~/components/ui';
import { useHealthCheck } from '~/data-provider';
import { Banner } from '~/components/Banners';

/** Isolates keyboard shortcut listeners so they only mount after auth. */
function KeyboardShortcutsProvider() {
  useKeyboardShortcuts();
  return (
    <>
      <KeyboardShortcutsDialog />
      <KeyboardDeleteDialog />
    </>
  );
}

export default function Root() {
  const [showTerms, setShowTerms] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  /** Shared with the drawer so the two agree on the breakpoint-transition frame. */
  const { isSmallScreen, expanded: sidebarExpanded } = useSidebarState();
  /** The one path drawer mutations take: it kicks the slide imperatively and
   *  defers the Recoil flip, so a large conversation cannot stall first motion. */
  const { setSidebarOpen } = useSidebarToggle();
  /** The drawer and pane snap under reduced motion (see kickDrawerAnimation),
   *  so the scrim must not keep fading on its own. */
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const paneRef = useRef<HTMLDivElement>(null);
  /** Keyed off the committed state rather than the scrim's own click, because
   *  the header button, Escape, conversation selection and the bottom bar all
   *  close the drawer too. */
  const { isSliding, onScrimClick } = useDrawerDismiss({
    expanded: sidebarExpanded,
    isSmallScreen,
    prefersReducedMotion,
    paneRef,
    setOpen: setSidebarOpen,
  });
  const { isAuthenticated, logout } = useAuthContext();
  /** Releases feature-catalog queries after first paint on browser idle. */
  useCatalogWarmup(isAuthenticated);

  useHealthCheck(isAuthenticated);

  const assistantsMap = useAssistantsMap({ isAuthenticated });
  const agentsMap = useAgentsMap({ isAuthenticated });
  const fileMap = useFileMap({ isAuthenticated });

  const { data: config } = useGetStartupConfig();
  const { data: termsData } = useUserTermsQuery({
    enabled: isAuthenticated && config?.interface?.termsOfService?.modalAcceptance === true,
  });

  useSearchEnabled(isAuthenticated);

  useEffect(() => {
    if (termsData) {
      setShowTerms(!termsData.termsAccepted);
    }
  }, [termsData]);

  const handleAcceptTerms = () => {
    setShowTerms(false);
  };

  const handleDeclineTerms = () => {
    setShowTerms(false);
    logout('/login?redirect=false');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SetConvoProvider>
      <FileMapContext.Provider value={fileMap}>
        <AssistantsMapContext.Provider value={assistantsMap}>
          <AgentsMapContext.Provider value={agentsMap}>
            <PromptGroupsProvider>
              <Banner onHeightChange={setBannerHeight} />
              <div className="flex" style={{ height: `calc(100dvh - ${bannerHeight}px)` }}>
                <div className="relative z-0 flex h-full w-full overflow-hidden">
                  <UnifiedSidebar />
                  <div
                    ref={paneRef}
                    /** Focus target of last resort when the drawer closes on a
                     *  route that renders no opener. Not in the tab order. */
                    tabIndex={-1}
                    className="relative flex h-full max-w-full flex-1 flex-col overflow-hidden focus:outline-none"
                    /** Recoil's flip is deferred past the opening frames and
                     *  the closing transition outlives it at the other end, so
                     *  `isSliding` covers the travel `sidebarExpanded` brackets
                     *  too late and drops too early. */
                    inert={isSmallScreen && (sidebarExpanded || isSliding) ? '' : undefined}
                  >
                    <Outlet />
                  </div>
                  {isSmallScreen && (sidebarExpanded || isSliding) && (
                    <MobileDrawerScrim
                      expanded={sidebarExpanded}
                      isSliding={isSliding}
                      prefersReducedMotion={prefersReducedMotion}
                      onClick={onScrimClick}
                    />
                  )}
                </div>
              </div>
            </PromptGroupsProvider>
            <KeyboardShortcutsProvider />
          </AgentsMapContext.Provider>
          {config?.interface?.termsOfService?.modalAcceptance === true && (
            <TermsAndConditionsModal
              open={showTerms}
              onOpenChange={setShowTerms}
              onAccept={handleAcceptTerms}
              onDecline={handleDeclineTerms}
              title={config.interface.termsOfService.modalTitle}
              modalContent={config.interface.termsOfService.modalContent}
            />
          )}
        </AssistantsMapContext.Provider>
      </FileMapContext.Provider>
    </SetConvoProvider>
  );
}
