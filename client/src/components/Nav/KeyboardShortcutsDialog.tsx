import { memo, useCallback, useId, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useRecoilState } from 'recoil';
import {
  Label,
  Switch,
  OGDialog,
  OGDialogClose,
  OGDialogTitle,
  OGDialogContent,
} from '@librechat/client';
import type { ShortcutActionId, ShortcutBindingInfo } from '~/hooks/useKeyboardShortcuts';
import type { TranslationKeys } from '~/hooks/useLocalize';
import type { ShortcutBinding } from '~/utils/shortcuts';
import { isMac, TING_SHORTCUTS, useShortcutBindings } from '~/hooks/useKeyboardShortcuts';
import { RecorderInfo, RecorderPill, useShortcutRecorder } from './ShortcutRecorder';
import { bindingDisplayKeys } from '~/utils/shortcuts';
import { TingButton, TingIconButton } from '~/ting';
import ShortcutKeyCombo from './ShortcutKeyCombo';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';

type GroupedBindings = Record<string, ShortcutBindingInfo[]>;

const PANELS_GROUP = 'com_shortcut_group_panels';

function EditingRow({
  info,
  label,
  bindingMap,
  getActionLabel,
  setBinding,
  onStopEdit,
}: {
  info: ShortcutBindingInfo;
  label: string;
  bindingMap: Map<string, ShortcutActionId>;
  getActionLabel: (id: string) => string;
  setBinding: (id: ShortcutActionId, binding: ShortcutBinding | null) => void;
  onStopEdit: () => void;
}) {
  const localize = useLocalize();

  const handleSave = useCallback(
    (binding: ShortcutBinding) => {
      setBinding(info.id, binding);
      onStopEdit();
    },
    [info.id, setBinding, onStopEdit],
  );

  const handleSaveReplacing = useCallback(
    (binding: ShortcutBinding, conflictId: string) => {
      setBinding(conflictId as ShortcutActionId, null);
      setBinding(info.id, binding);
      onStopEdit();
    },
    [info.id, setBinding, onStopEdit],
  );

  const recorder = useShortcutRecorder({
    initial: info.binding,
    bindingMap: bindingMap as Map<string, string>,
    ownerId: info.id,
    getActionLabel,
    onSave: handleSave,
    onCancel: onStopEdit,
  });

  return (
    <div ref={recorder.boundaryRef} className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-text-primary">{label}</span>
        <RecorderPill
          state={recorder}
          ariaLabel={localize('com_shortcut_edit_aria', { 0: label })}
          ownerId={info.id}
        />
      </div>
      <RecorderInfo
        state={recorder}
        ownerId={info.id}
        onCancel={onStopEdit}
        onSaveReplacing={handleSaveReplacing}
      />
    </div>
  );
}

function ShortcutRow({
  info,
  isEditing,
  disabled,
  onStartEdit,
  onStopEdit,
  bindingMap,
  getActionLabel,
  setBinding,
  resetBinding,
}: {
  info: ShortcutBindingInfo;
  isEditing: boolean;
  disabled: boolean;
  onStartEdit: (id: ShortcutActionId) => void;
  onStopEdit: () => void;
  bindingMap: Map<string, ShortcutActionId>;
  getActionLabel: (id: string) => string;
  setBinding: (id: ShortcutActionId, binding: ShortcutBinding | null) => void;
  resetBinding: (id: ShortcutActionId) => void;
}) {
  const localize = useLocalize();
  const label = localize(info.labelKey as TranslationKeys);
  const displayKeys = useMemo(() => bindingDisplayKeys(info.binding, isMac), [info.binding]);
  const editAriaLabel = localize('com_shortcut_edit_aria', { 0: label });
  const isUnset = displayKeys.length === 0;

  if (isEditing && !disabled) {
    return (
      <div className="px-2 py-2">
        <EditingRow
          info={info}
          label={label}
          bindingMap={bindingMap}
          getActionLabel={getActionLabel}
          setBinding={setBinding}
          onStopEdit={onStopEdit}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-2 py-2">
      <span
        className={cn(
          'truncate',
          isUnset || disabled ? 'text-text-secondary' : 'text-text-primary',
        )}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        {info.isCustom && (
          <TingButton
            type="button"
            variant="secondary"
            size="compact"
            disabled={disabled}
            onClick={() => resetBinding(info.id)}
          >
            {localize('com_shortcut_reset')}
          </TingButton>
        )}
        {isUnset ? (
          <TingButton
            type="button"
            variant="secondary"
            size="compact"
            disabled={disabled}
            onClick={() => onStartEdit(info.id)}
            aria-label={editAriaLabel}
            data-testid={`edit-shortcut-${info.id}`}
          >
            <Plus aria-hidden="true" />
            {localize('com_shortcut_set')}
          </TingButton>
        ) : (
          <TingButton
            type="button"
            variant="secondary"
            size="compact"
            disabled={disabled}
            onClick={() => onStartEdit(info.id)}
            aria-label={editAriaLabel}
            data-testid={`edit-shortcut-${info.id}`}
          >
            <ShortcutKeyCombo keys={displayKeys} />
          </TingButton>
        )}
      </div>
    </div>
  );
}

function ShortcutGroup({
  groupKey,
  bindings,
  editingId,
  disabled,
  onStartEdit,
  onStopEdit,
  bindingMap,
  getActionLabel,
  setBinding,
  resetBinding,
}: {
  groupKey: string;
  bindings: ShortcutBindingInfo[];
  editingId: ShortcutActionId | null;
  disabled: boolean;
  onStartEdit: (id: ShortcutActionId) => void;
  onStopEdit: () => void;
  bindingMap: Map<string, ShortcutActionId>;
  getActionLabel: (id: string) => string;
  setBinding: (id: ShortcutActionId, binding: ShortcutBinding | null) => void;
  resetBinding: (id: ShortcutActionId) => void;
}) {
  const localize = useLocalize();
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="mb-2 px-2 font-bold text-text-secondary">
        {localize(groupKey as TranslationKeys)}
      </h3>
      <div className="flex flex-col">
        {bindings.map((info) => (
          <ShortcutRow
            key={info.id}
            info={info}
            isEditing={editingId === info.id}
            disabled={disabled}
            onStartEdit={onStartEdit}
            onStopEdit={onStopEdit}
            bindingMap={bindingMap}
            getActionLabel={getActionLabel}
            setBinding={setBinding}
            resetBinding={resetBinding}
          />
        ))}
      </div>
    </section>
  );
}

function PanelsSection({
  bindings,
  editingId,
  disabled,
  onStartEdit,
  onStopEdit,
  bindingMap,
  getActionLabel,
  setBinding,
  resetBinding,
}: {
  bindings: ShortcutBindingInfo[];
  editingId: ShortcutActionId | null;
  disabled: boolean;
  onStartEdit: (id: ShortcutActionId) => void;
  onStopEdit: () => void;
  bindingMap: Map<string, ShortcutActionId>;
  getActionLabel: (id: string) => string;
  setBinding: (id: ShortcutActionId, binding: ShortcutBinding | null) => void;
  resetBinding: (id: ShortcutActionId) => void;
}) {
  const localize = useLocalize();
  return (
    <section className="mb-6 last:mb-0 min-[800px]:col-span-2">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 px-2">
        <h3 className="font-bold text-text-secondary">{localize('com_shortcut_group_panels')}</h3>
        <p className="text-text-secondary">{localize('com_shortcut_group_panels_hint')}</p>
      </div>
      <div className="grid grid-cols-1 gap-x-8 min-[800px]:grid-cols-2">
        {bindings.map((info) => (
          <ShortcutRow
            key={info.id}
            info={info}
            isEditing={editingId === info.id}
            disabled={disabled}
            onStartEdit={onStartEdit}
            onStopEdit={onStopEdit}
            bindingMap={bindingMap}
            getActionLabel={getActionLabel}
            setBinding={setBinding}
            resetBinding={resetBinding}
          />
        ))}
      </div>
    </section>
  );
}

function KeyboardShortcutsDialog() {
  const localize = useLocalize();
  const { bindings, bindingMap, setBinding, resetBinding, resetAll } = useShortcutBindings();
  const [open, setOpen] = useRecoilState(store.showShortcutsDialog);
  const [enabled, setEnabled] = useRecoilState(store.shortcutsEnabled);
  const [editingId, setEditingId] = useState<ShortcutActionId | null>(null);
  const enableSwitchId = useId();
  const visibleBindings = useMemo(
    () => bindings.filter((binding) => TING_SHORTCUTS.has(binding.id)),
    [bindings],
  );

  const grouped = useMemo<GroupedBindings>(() => {
    const groups: GroupedBindings = {};
    for (const info of visibleBindings) {
      const group = info.groupKey;
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(info);
    }
    return groups;
  }, [visibleBindings]);

  const groupEntries = useMemo(() => Object.entries(grouped), [grouped]);

  const leftColumn = useMemo(
    () => groupEntries.filter(([key]) => key !== 'com_shortcut_group_chat' && key !== PANELS_GROUP),
    [groupEntries],
  );
  const rightColumn = useMemo(
    () => groupEntries.filter(([key]) => key === 'com_shortcut_group_chat'),
    [groupEntries],
  );
  const panelEntries = useMemo(() => grouped[PANELS_GROUP] ?? [], [grouped]);

  const labelMap = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const info of visibleBindings) {
      map.set(info.id, localize(info.labelKey as TranslationKeys));
    }
    return map;
  }, [visibleBindings, localize]);

  const getActionLabel = useCallback((id: string) => labelMap.get(id) ?? id, [labelMap]);

  const handleStartEdit = useCallback((id: ShortcutActionId) => {
    setEditingId(id);
  }, []);
  const handleStopEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const hasAnyCustom = useMemo(
    () => visibleBindings.some((binding) => binding.isCustom),
    [visibleBindings],
  );

  return (
    <OGDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setEditingId(null);
        }
        setOpen(next);
      }}
    >
      <OGDialogContent
        showCloseButton={false}
        overlayClassName="ting-dialog-backdrop"
        className="dialog flex flex-col"
      >
        <header className="dialog__head">
          <OGDialogTitle>{localize('com_shortcut_keyboard_shortcuts')}</OGDialogTitle>
          <OGDialogClose asChild>
            <TingIconButton
              variant="quiet"
              label={localize('com_ui_close')}
              aria-label={localize('com_ui_close')}
            >
              <X aria-hidden="true" />
            </TingIconButton>
          </OGDialogClose>
        </header>

        <div className="dialog__body min-h-0 flex-1">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label
                  htmlFor={enableSwitchId}
                  className="cursor-pointer select-none font-bold text-text-primary"
                >
                  {localize('com_shortcut_keyboard_shortcuts')}
                </Label>
                <p className="mt-1 text-text-secondary">
                  {localize('com_shortcut_enable_all_hint')}
                </p>
              </div>
              <Switch
                id={enableSwitchId}
                checked={enabled}
                onCheckedChange={(value) => {
                  const next = value !== false;
                  if (!next) {
                    setEditingId(null);
                  }
                  setEnabled(next);
                }}
                aria-label={localize('com_shortcut_keyboard_shortcuts')}
              />
            </div>

            <div className="grid grid-cols-1 gap-x-8 min-[800px]:grid-cols-2">
              <div>
                {leftColumn.map(([groupKey, items]) => (
                  <ShortcutGroup
                    key={groupKey}
                    groupKey={groupKey}
                    bindings={items}
                    editingId={editingId}
                    disabled={!enabled}
                    onStartEdit={handleStartEdit}
                    onStopEdit={handleStopEdit}
                    bindingMap={bindingMap}
                    getActionLabel={getActionLabel}
                    setBinding={setBinding}
                    resetBinding={resetBinding}
                  />
                ))}
              </div>
              <div>
                {rightColumn.map(([groupKey, items]) => (
                  <ShortcutGroup
                    key={groupKey}
                    groupKey={groupKey}
                    bindings={items}
                    editingId={editingId}
                    disabled={!enabled}
                    onStartEdit={handleStartEdit}
                    onStopEdit={handleStopEdit}
                    bindingMap={bindingMap}
                    getActionLabel={getActionLabel}
                    setBinding={setBinding}
                    resetBinding={resetBinding}
                  />
                ))}
              </div>
              {panelEntries.length > 0 && (
                <PanelsSection
                  bindings={panelEntries}
                  editingId={editingId}
                  disabled={!enabled}
                  onStartEdit={handleStartEdit}
                  onStopEdit={handleStopEdit}
                  bindingMap={bindingMap}
                  getActionLabel={getActionLabel}
                  setBinding={setBinding}
                  resetBinding={resetBinding}
                />
              )}
            </div>
          </div>
        </div>

        {hasAnyCustom && (
          <footer className="dialog__foot">
            <TingButton type="button" variant="secondary" size="compact" onClick={resetAll}>
              {localize('com_shortcut_reset_all')}
            </TingButton>
          </footer>
        )}
      </OGDialogContent>
    </OGDialog>
  );
}

export default memo(KeyboardShortcutsDialog);
