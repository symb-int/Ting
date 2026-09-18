import type { TBackupCode } from 'librechat-data-provider';
import type { LocalizeFunction } from '~/common';

export function getBackupCodeDescription(
  code: TBackupCode,
  index: number,
  localize: LocalizeFunction,
): string {
  const label = localize('com_ui_backup_code_number', { number: index + 1 });

  if (!code.used) {
    return `${label}, ${localize('com_ui_not_used')}`;
  }

  const usedAt = code.usedAt
    ? new Date(code.usedAt).toLocaleDateString()
    : localize('com_ui_unknown');

  return `${label}, ${localize('com_ui_used')}: ${usedAt}`;
}
