import { createStore } from 'jotai';
import { applyFontSize } from '@librechat/client';
import { fontSizeAtom, initializeFontSize } from '../fontSize';

jest.mock('@librechat/client', () => ({
  applyFontSize: jest.fn(),
}));

describe('TING font size', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('replaces a legacy saved size with the fixed default at startup', () => {
    localStorage.setItem('fontSize', JSON.stringify('text-xl'));

    initializeFontSize();

    expect(localStorage.getItem('fontSize')).toBe(JSON.stringify('text-base'));
    expect(applyFontSize).toHaveBeenCalledWith('text-base');
  });

  it('keeps the exposed atom fixed when an unavailable control tries to write it', () => {
    const store = createStore();

    store.set(fontSizeAtom, 'text-xl');

    expect(store.get(fontSizeAtom)).toBe('text-base');
    expect(applyFontSize).toHaveBeenCalledWith('text-base');
  });
});
