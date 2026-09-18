import type { LocalizeFunction } from '~/common';
import { getBackupCodeDescription } from '../backup';

const localize = ((key, options) => {
  if (key === 'com_ui_backup_code_number') {
    return `Code ${options?.number}`;
  }

  if (key === 'com_ui_not_used') {
    return 'Noch nicht verwendet';
  }

  if (key === 'com_ui_used') {
    return 'Verwendet';
  }

  if (key === 'com_ui_unknown') {
    return 'Unbekannt';
  }

  return key;
}) as LocalizeFunction;

describe('getBackupCodeDescription', () => {
  it('describes an unused code in the active locale', () => {
    expect(
      getBackupCodeDescription({ codeHash: 'unused', used: false, usedAt: null }, 0, localize),
    ).toBe('Code 1, Noch nicht verwendet');
  });

  it('describes a used code with its localized date', () => {
    const usedAt = new Date(2026, 8, 18);

    expect(getBackupCodeDescription({ codeHash: 'used', used: true, usedAt }, 1, localize)).toBe(
      `Code 2, Verwendet: ${usedAt.toLocaleDateString()}`,
    );
  });

  it('announces an unknown use date in the active locale', () => {
    expect(
      getBackupCodeDescription({ codeHash: 'unknown', used: true, usedAt: null }, 2, localize),
    ).toBe('Code 3, Verwendet: Unbekannt');
  });
});
