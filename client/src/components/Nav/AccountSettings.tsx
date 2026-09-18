import { useState, memo, useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import * as Menu from '@ariakit/react/menu';
import { GearIcon, DropdownMenuSeparator, Avatar } from '@librechat/client';
import {
  Archive,
  ChevronRight,
  CircleHelp,
  Keyboard,
  LifeBuoy,
  LogOut,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { ArchivedChatsModal } from '~/components/Nav/SettingsTabs/General/ArchivedChatsModal';
import { useGetStartupConfig } from '~/data-provider';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';
import Settings from './Settings';
import store from '~/store';

function HelpSubmenu({
  helpAndFaqURL,
  termsOfServiceURL,
  privacyPolicyURL,
  onShowShortcuts,
}: {
  helpAndFaqURL?: string;
  termsOfServiceURL?: string;
  privacyPolicyURL?: string;
  onShowShortcuts: () => void;
}) {
  const localize = useLocalize();
  const hasHelpFaq = !!helpAndFaqURL && helpAndFaqURL !== '/';
  const hasTos = !!termsOfServiceURL;
  const hasPrivacy = !!privacyPolicyURL;
  const showLegalDivider = (hasHelpFaq || true) && (hasTos || hasPrivacy);

  return (
    <Menu.MenuProvider placement="right-start">
      <Menu.MenuItem
        hideOnClick={false}
        render={
          <Menu.MenuButton className="ting-menu__item select-item flex w-full cursor-pointer items-center gap-2 text-sm" />
        }
      >
        <CircleHelp className="icon-md" aria-hidden="true" />
        <span className="flex-1 text-left">{localize('com_nav_help')}</span>
        <ChevronRight className="h-4 w-4 text-text-secondary" aria-hidden="true" />
      </Menu.MenuItem>
      <Menu.Menu
        portal
        gutter={12}
        className="ting-menu account-settings-popover popover-ui popover-from-left z-[126] w-[244px]"
      >
        {hasHelpFaq && (
          <Menu.MenuItem
            onClick={() => window.open(helpAndFaqURL, '_blank', 'noopener,noreferrer')}
            className="ting-menu__item select-item text-sm"
          >
            <LifeBuoy className="icon-md" aria-hidden="true" />
            {localize('com_nav_help_faq')}
          </Menu.MenuItem>
        )}
        <Menu.MenuItem onClick={onShowShortcuts} className="ting-menu__item select-item text-sm">
          <Keyboard className="icon-md" aria-hidden="true" />
          {localize('com_shortcut_keyboard_shortcuts')}
        </Menu.MenuItem>
        {showLegalDivider && (hasTos || hasPrivacy) && <DropdownMenuSeparator />}
        {hasTos && (
          <Menu.MenuItem
            onClick={() => window.open(termsOfServiceURL, '_blank', 'noopener,noreferrer')}
            className="ting-menu__item select-item text-sm"
          >
            <Scale className="icon-md" aria-hidden="true" />
            {localize('com_ui_terms_of_service')}
          </Menu.MenuItem>
        )}
        {hasPrivacy && (
          <Menu.MenuItem
            onClick={() => window.open(privacyPolicyURL, '_blank', 'noopener,noreferrer')}
            className="ting-menu__item select-item text-sm"
          >
            <ShieldCheck className="icon-md" aria-hidden="true" />
            {localize('com_ui_privacy_policy')}
          </Menu.MenuItem>
        )}
      </Menu.Menu>
    </Menu.MenuProvider>
  );
}

function AccountSettings({ collapsed = false }: { collapsed?: boolean }) {
  const localize = useLocalize();
  const { user, logout } = useAuthContext();
  const { data: startupConfig } = useGetStartupConfig();
  const [showSettings, setShowSettings] = useState(false);
  const setShowShortcutsDialog = useSetRecoilState(store.showShortcutsDialog);
  const [showArchived, setShowArchived] = useState(false);
  const accountSettingsButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Menu.MenuProvider placement={collapsed ? 'right-end' : undefined}>
      <Menu.MenuButton
        ref={accountSettingsButtonRef}
        aria-label={localize('com_nav_account_settings')}
        data-testid="nav-user"
        className={
          collapsed
            ? 'flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-surface-active-alt aria-[expanded=true]:bg-surface-active-alt'
            : 'ting-account-row flex h-auto w-full items-center gap-2 text-sm'
        }
      >
        <div className={collapsed ? 'size-7 flex-shrink-0' : 'h-9 w-9 flex-shrink-0'}>
          <div className="relative flex">
            <Avatar user={user} size={collapsed ? 28 : 36} />
          </div>
        </div>
        {!collapsed && (
          <div className="ting-account-row__copy">
            <span className="ting-account-row__name">
              {user?.name ?? user?.username ?? localize('com_nav_user')}
            </span>
            <span className="ting-account-row__label">{localize('com_ting_account')}</span>
          </div>
        )}
        {!collapsed && <GearIcon className="ting-account-row__gear" aria-hidden="true" />}
      </Menu.MenuButton>
      <Menu.Menu
        portal
        className="ting-menu account-settings-popover popover-ui z-[125] w-[305px] min-[800px]:w-[244px]"
        style={{
          transformOrigin: collapsed ? 'left bottom' : 'bottom',
          translate: collapsed ? '4px 0' : '0 -4px',
        }}
      >
        <div className="text-token-text-secondary ml-3 mr-2 py-2 text-sm" role="note">
          {user?.email ?? localize('com_nav_user')}
        </div>
        <DropdownMenuSeparator />
        <Menu.MenuItem
          onClick={() => setShowSettings(true)}
          className="ting-menu__item select-item text-sm"
          data-testid="nav-settings"
        >
          <GearIcon className="icon-md" aria-hidden="true" />
          {localize('com_nav_settings')}
        </Menu.MenuItem>
        <Menu.MenuItem
          onClick={() => setShowArchived(true)}
          className="ting-menu__item select-item text-sm"
        >
          <Archive className="icon-md" aria-hidden="true" />
          {localize('com_ting_archived_cases')}
        </Menu.MenuItem>
        <HelpSubmenu
          helpAndFaqURL={startupConfig?.helpAndFaqURL}
          termsOfServiceURL={startupConfig?.interface?.termsOfService?.externalUrl}
          privacyPolicyURL={startupConfig?.interface?.privacyPolicy?.externalUrl}
          onShowShortcuts={() => setShowShortcutsDialog(true)}
        />
        <DropdownMenuSeparator />
        <Menu.MenuItem onClick={() => logout()} className="ting-menu__item select-item text-sm">
          <LogOut className="icon-md" aria-hidden="true" />
          {localize('com_nav_log_out')}
        </Menu.MenuItem>
      </Menu.Menu>
      {showArchived && (
        <ArchivedChatsModal
          open={showArchived}
          onOpenChange={setShowArchived}
          triggerRef={accountSettingsButtonRef}
        />
      )}
      {showSettings && <Settings open={showSettings} onOpenChange={setShowSettings} />}
    </Menu.MenuProvider>
  );
}

export default memo(AccountSettings);
