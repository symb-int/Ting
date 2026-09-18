import * as Tabs from '@radix-ui/react-tabs';
import { Search, X, ChevronRight } from 'lucide-react';
import type { SettingsContextValue, SettingsTab } from './types';
import { TingIconButton, TingInput } from '~/ting';
import { useLocalize } from '~/hooks';
import { TABS } from './types';
import { cn } from '~/utils';

interface SidebarProps {
  ctx: SettingsContextValue;
  query: string;
  onQueryChange: (q: string) => void;
  onSelectTab: (tab: SettingsTab) => void;
  showChevron?: boolean;
  hideTabs?: boolean;
}

export default function Sidebar({
  ctx,
  query,
  onQueryChange,
  onSelectTab,
  showChevron = false,
  hideTabs = false,
}: SidebarProps) {
  const localize = useLocalize();
  const tabs = TABS.filter((t) => !t.show || t.show(ctx));

  return (
    <div className="flex w-full flex-col gap-3 min-[800px]:w-48 min-[800px]:shrink-0">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden="true"
        />
        <TingInput
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && query.length > 0) {
              e.preventDefault();
              e.stopPropagation();
              onQueryChange('');
            }
          }}
          placeholder={localize('com_ui_settings_search_placeholder')}
          aria-label={localize('com_ui_settings_search_placeholder')}
          className="bg-surface-primary pl-9 pr-10"
        />
        {query.length > 0 && (
          <TingIconButton
            type="button"
            variant="quiet"
            onClick={() => onQueryChange('')}
            label={localize('com_ui_clear_search')}
            aria-label={localize('com_ui_clear_search')}
            className="absolute right-1 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </TingIconButton>
        )}
      </div>
      {!hideTabs && (
        <Tabs.List
          aria-label={localize('com_nav_settings')}
          className="flex flex-col gap-1 overflow-visible"
        >
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={cn(
                'ting-control flex min-h-9 items-center justify-between gap-2 rounded-[5px] border border-transparent px-3 py-2 text-sm leading-[1.35] text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-accent-primary-hover focus-visible:outline-none',
                'radix-state-active:border-accent-primary radix-state-active:bg-surface-tertiary radix-state-active:text-accent-primary',
              )}
            >
              <span className="flex items-center gap-2">
                {tab.icon}
                <span className="whitespace-nowrap">{localize(tab.labelKey)}</span>
              </span>
              {showChevron && (
                <ChevronRight
                  className="h-4 w-4 flex-shrink-0 text-text-tertiary"
                  aria-hidden="true"
                />
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      )}
    </div>
  );
}
