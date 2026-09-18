import { SettingsTabValues } from 'librechat-data-provider';
import type { SettingEntry } from './types';
import EnableTwoFactorItem from '../SettingsTabs/Account/TwoFactorAuthentication';
import BackupCodesItem from '../SettingsTabs/Account/BackupCodesItem';
import DeleteAccount from '../SettingsTabs/Account/DeleteAccount';
import Avatar from '../SettingsTabs/Account/Avatar';
import { autoScrollAtom } from '~/store/autoScroll';
import { toggleControl } from './controls';
import store from '~/store';

const { ACCOUNT, CHAT } = SettingsTabValues;

export const registry: SettingEntry[] = [
  {
    id: 'avatar',
    tab: ACCOUNT,
    section: 'profile',
    labelKey: 'com_ui_settings_label_avatar',
    Component: Avatar,
  },
  {
    id: 'twoFactor',
    tab: ACCOUNT,
    section: 'security',
    labelKey: 'com_ui_settings_label_2fa',
    show: (ctx) => ctx.isLocalProvider,
    Component: EnableTwoFactorItem,
  },
  {
    id: 'backupCodes',
    tab: ACCOUNT,
    section: 'security',
    labelKey: 'com_ui_settings_label_backup_codes',
    show: (ctx) => ctx.isLocalProvider && ctx.twoFactorEnabled,
    Component: BackupCodesItem,
  },
  {
    id: 'deleteAccount',
    tab: ACCOUNT,
    section: 'danger',
    labelKey: 'com_ui_settings_label_delete_account',
    show: (ctx) => ctx.allowAccountDeletion,
    Component: DeleteAccount,
  },
  {
    id: 'enterToSend',
    tab: CHAT,
    section: 'sending',
    labelKey: 'com_nav_enter_to_send',
    keywords: ['return', 'newline'],
    Component: toggleControl({
      stateAtom: store.enterToSend,
      localizationKey: 'com_nav_enter_to_send',
      switchId: 'enterToSend',
      hoverCardText: 'com_nav_info_enter_to_send',
    }),
  },
  {
    id: 'saveDrafts',
    tab: CHAT,
    section: 'sending',
    labelKey: 'com_nav_save_drafts',
    Component: toggleControl({
      stateAtom: store.saveDrafts,
      localizationKey: 'com_nav_save_drafts',
      switchId: 'saveDrafts',
      hoverCardText: 'com_nav_info_save_draft',
    }),
  },
  {
    id: 'autoScroll',
    tab: CHAT,
    section: 'conversations',
    labelKey: 'com_nav_auto_scroll',
    Component: toggleControl({
      stateAtom: autoScrollAtom,
      localizationKey: 'com_nav_auto_scroll',
      switchId: 'autoScroll',
    }),
  },
  {
    id: 'showScrollButton',
    tab: CHAT,
    section: 'conversations',
    labelKey: 'com_nav_scroll_button',
    Component: toggleControl({
      stateAtom: store.showScrollButton,
      localizationKey: 'com_nav_scroll_button',
      switchId: 'showScrollButton',
    }),
  },
];
