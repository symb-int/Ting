import { atom } from 'jotai';
import { applyFontSize } from '@librechat/client';

const DEFAULT_FONT_SIZE = 'text-base';
const defaultFontSizeAtom = atom(DEFAULT_FONT_SIZE);

/** TING has one fixed message size; legacy LibreChat preferences stay inactive. */
export const fontSizeAtom = atom(
  (get) => get(defaultFontSizeAtom),
  (_get, set, _fontSize: string) => {
    set(defaultFontSizeAtom, DEFAULT_FONT_SIZE);
    applyFontSize(DEFAULT_FONT_SIZE);
  },
);

export const initializeFontSize = (): void => {
  localStorage.setItem('fontSize', JSON.stringify(DEFAULT_FONT_SIZE));
  applyFontSize(DEFAULT_FONT_SIZE);
};
