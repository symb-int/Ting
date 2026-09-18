import { isValidElementType } from 'react-is';
import type { SettingsContextValue } from '../types';
import en from '~/locales/en/translation.json';
import { registry } from '../registry';
import { TABS } from '../types';

const validTabSections = new Map(TABS.map((t) => [t.id, new Set(t.sections.map((s) => s.id))]));

const settingsContext: SettingsContextValue = {
  balanceEnabled: false,
  hasAnyPersonalizationFeature: false,
  hasMemoryOptOut: false,
  hasStatefulCodeSessions: false,
  hasRemoteAgents: false,
  hasUserProvidedEndpoints: false,
  hasMultiConvo: false,
  hasPrompts: false,
  isLocalProvider: true,
  twoFactorEnabled: false,
  allowAccountDeletion: true,
  aboutEnabled: false,
  engineTTS: 'browser',
  langfuseConnectionAccess: false,
  adminPanelURL: '',
};

describe('settings registry', () => {
  it('contains exactly the TING increment settings', () => {
    expect(registry.map((entry) => entry.id)).toEqual([
      'avatar',
      'twoFactor',
      'backupCodes',
      'deleteAccount',
      'enterToSend',
      'saveDrafts',
      'autoScroll',
      'showScrollButton',
    ]);
  });

  it('has unique ids', () => {
    const ids = registry.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references a valid tab and section for every entry', () => {
    for (const entry of registry) {
      const sections = validTabSections.get(entry.tab);
      expect(sections).toBeDefined();
      expect(sections!.has(entry.section)).toBe(true);
    }
  });

  it('uses label keys that exist in the English locale', () => {
    for (const entry of registry) {
      expect(en).toHaveProperty(entry.labelKey);
    }
  });

  it('has a renderable Component for every entry', () => {
    for (const entry of registry) {
      expect(isValidElementType(entry.Component)).toBe(true);
    }
  });

  describe('account security visibility', () => {
    const twoFactorEntry = registry.find((entry) => entry.id === 'twoFactor');
    const backupCodesEntry = registry.find((entry) => entry.id === 'backupCodes');
    const deleteAccountEntry = registry.find((entry) => entry.id === 'deleteAccount');

    it('only offers two-factor authentication to local accounts', () => {
      expect(twoFactorEntry?.show?.(settingsContext)).toBe(true);
      expect(twoFactorEntry?.show?.({ ...settingsContext, isLocalProvider: false })).toBe(false);
    });

    it('only offers backup codes when two-factor authentication is enabled', () => {
      expect(backupCodesEntry?.show?.(settingsContext)).toBe(false);
      expect(backupCodesEntry?.show?.({ ...settingsContext, twoFactorEnabled: true })).toBe(true);
    });

    it('respects account deletion configuration', () => {
      expect(deleteAccountEntry?.show?.(settingsContext)).toBe(true);
      expect(deleteAccountEntry?.show?.({ ...settingsContext, allowAccountDeletion: false })).toBe(
        false,
      );
    });
  });
});
