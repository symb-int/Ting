import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { X, ChevronLeft } from 'lucide-react';
import { useMediaQuery } from '@librechat/client';
import { SettingsTabValues } from 'librechat-data-provider';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import type { TDialogProps } from '~/common';
import type { SettingsTab } from './types';
import { TingButton, TingIconButton } from '~/ting';
import { useSettingsContext } from './context';
import { useLocalize } from '~/hooks';
import Sidebar from './Sidebar';
import Content from './Content';
import { TABS } from './types';

export default function SettingsDialog({ open, onOpenChange }: TDialogProps) {
  const localize = useLocalize();
  const ctx = useSettingsContext();
  const isSmallScreen = useMediaQuery('(max-width: 799px)');
  const [activeTab, setActiveTab] = useState<SettingsTab>(SettingsTabValues.ACCOUNT);
  const [query, setQuery] = useState('');
  const [mobileDetail, setMobileDetail] = useState(false);

  const searching = query.trim().length > 0;
  const inDetail = isSmallScreen && mobileDetail && !searching;
  const showSidebar = !isSmallScreen || !inDetail;
  const showContent = !isSmallScreen || inDetail || searching;
  const hideTabs = isSmallScreen && searching;
  const visibleTabs = TABS.filter((t) => !t.show || t.show(ctx));
  const effectiveTab = visibleTabs.some((t) => t.id === activeTab)
    ? activeTab
    : (visibleTabs[0]?.id ?? SettingsTabValues.ACCOUNT);
  const activeMeta = TABS.find((t) => t.id === effectiveTab);

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (isSmallScreen) {
      setMobileDetail(true);
    }
  };

  return (
    <Transition appear show={open}>
      <Dialog as="div" className="relative z-50" onClose={() => onOpenChange(false)}>
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="ting-dialog-backdrop ting-settings-dialog-transition ting-settings-dialog-transition--backdrop fixed inset-0"
            aria-hidden="true"
          />
        </TransitionChild>
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="ting-settings-dialog-transition ting-settings-dialog-transition--panel fixed inset-0 flex w-screen items-center justify-center p-4">
            <DialogPanel className="dialog flex flex-col">
              <DialogTitle as="div" className="dialog__head flex items-center justify-between">
                {inDetail ? (
                  <TingButton
                    type="button"
                    variant="secondary"
                    size="compact"
                    onClick={() => setMobileDetail(false)}
                    className="-ml-1"
                    aria-label={localize('com_ui_back')}
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    <span>
                      {activeMeta ? localize(activeMeta.labelKey) : localize('com_nav_settings')}
                    </span>
                  </TingButton>
                ) : (
                  <h2 className="text-text-primary">{localize('com_nav_settings')}</h2>
                )}
                <TingIconButton
                  variant="quiet"
                  onClick={() => onOpenChange(false)}
                  label={localize('com_ui_close_settings')}
                  aria-label={localize('com_ui_close_settings')}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </TingIconButton>
              </DialogTitle>
              <Tabs.Root
                value={effectiveTab}
                onValueChange={(v) => setActiveTab(v as SettingsTab)}
                orientation="vertical"
                className="dialog__body flex flex-1 flex-col gap-4 overflow-hidden min-[800px]:flex-row min-[800px]:gap-6"
              >
                {showSidebar && (
                  <Sidebar
                    ctx={ctx}
                    query={query}
                    onQueryChange={setQuery}
                    onSelectTab={selectTab}
                    showChevron={isSmallScreen}
                    hideTabs={hideTabs}
                  />
                )}
                {showContent && (
                  <div className="min-w-0 flex-1 overflow-y-auto min-[800px]:pr-1">
                    {searching ? (
                      <Content activeTab={effectiveTab} query={query} ctx={ctx} />
                    ) : (
                      <Tabs.Content
                        value={effectiveTab}
                        tabIndex={-1}
                        className="focus:outline-none"
                      >
                        <Content activeTab={effectiveTab} query={query} ctx={ctx} />
                      </Tabs.Content>
                    )}
                  </div>
                )}
              </Tabs.Root>
            </DialogPanel>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}
