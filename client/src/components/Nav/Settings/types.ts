import { createElement } from 'react';
import { MessageSquare } from 'lucide-react';
import { UserIcon } from '@librechat/client';
import { SettingsTabValues } from 'librechat-data-provider';
import type { ComponentType, ReactNode } from 'react';
import type { TranslationKeys } from '~/hooks';

export type SettingsTab = SettingsTabValues.ACCOUNT | SettingsTabValues.CHAT;

export type SectionId = 'profile' | 'security' | 'danger' | 'sending' | 'conversations';

export interface SettingsContextValue {
  balanceEnabled: boolean;
  hasAnyPersonalizationFeature: boolean;
  hasMemoryOptOut: boolean;
  hasStatefulCodeSessions: boolean;
  hasRemoteAgents: boolean;
  hasUserProvidedEndpoints: boolean;
  hasMultiConvo: boolean;
  hasPrompts: boolean;
  isLocalProvider: boolean;
  twoFactorEnabled: boolean;
  allowAccountDeletion: boolean;
  aboutEnabled: boolean;
  engineTTS: string;
  langfuseConnectionAccess: boolean;
  adminPanelURL: string;
}

export interface SettingEntry {
  id: string;
  tab: SettingsTab;
  section: SectionId;
  labelKey: TranslationKeys;
  keywords?: string[];
  Component: ComponentType;
  show?: (ctx: SettingsContextValue) => boolean;
}

export interface SectionMeta {
  id: SectionId;
  labelKey: TranslationKeys;
  icon?: ReactNode;
  danger?: boolean;
}

export interface TabMeta {
  id: SettingsTab;
  labelKey: TranslationKeys;
  icon: ReactNode;
  sections: SectionMeta[];
  show?: (ctx: SettingsContextValue) => boolean;
}

export const TABS: TabMeta[] = [
  {
    id: SettingsTabValues.ACCOUNT,
    labelKey: 'com_nav_setting_account',
    icon: createElement(UserIcon),
    sections: [
      { id: 'profile', labelKey: 'com_ui_settings_section_profile' },
      { id: 'security', labelKey: 'com_ui_settings_section_security' },
      { id: 'danger', labelKey: 'com_ui_settings_section_danger_zone', danger: true },
    ],
  },
  {
    id: SettingsTabValues.CHAT,
    labelKey: 'com_nav_setting_chat',
    icon: createElement(MessageSquare, { className: 'icon-sm', 'aria-hidden': true }),
    sections: [
      { id: 'sending', labelKey: 'com_ui_settings_section_sending' },
      { id: 'conversations', labelKey: 'com_ui_settings_section_conversations' },
    ],
  },
];
