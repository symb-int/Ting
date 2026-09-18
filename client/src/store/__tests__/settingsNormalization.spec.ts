describe('TING hidden preference normalization', () => {
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
  });

  it('replaces legacy values that would change the I01 surface', async () => {
    localStorage.setItem('enableUserMsgMarkdown', JSON.stringify(false));
    localStorage.setItem('maximizeChatSpace', JSON.stringify(true));
    localStorage.setItem('chatDirection', JSON.stringify('RTL'));
    localStorage.setItem('collapseLongUserMessages', JSON.stringify(true));
    localStorage.setItem('pasteLongTextAsFile', JSON.stringify(true));
    localStorage.setItem('centerFormOnLanding', JSON.stringify(false));
    localStorage.setItem('mobileDrawerStrip', JSON.stringify(true));

    const { snapshot_UNSTABLE } = await import('recoil');
    const { default: settings } = await import('../settings');
    const snapshot = snapshot_UNSTABLE();

    expect(snapshot.getLoadable(settings.enableUserMsgMarkdown).valueOrThrow()).toBe(true);
    expect(snapshot.getLoadable(settings.maximizeChatSpace).valueOrThrow()).toBe(false);
    expect(snapshot.getLoadable(settings.chatDirection).valueOrThrow()).toBe('LTR');
    expect(snapshot.getLoadable(settings.collapseLongUserMessages).valueOrThrow()).toBe(false);
    expect(snapshot.getLoadable(settings.pasteLongTextAsFile).valueOrThrow()).toBe(false);
    expect(snapshot.getLoadable(settings.centerFormOnLanding).valueOrThrow()).toBe(true);
    expect(snapshot.getLoadable(settings.mobileDrawerStrip).valueOrThrow()).toBe(false);

    expect(localStorage.getItem('enableUserMsgMarkdown')).toBe(JSON.stringify(true));
    expect(localStorage.getItem('maximizeChatSpace')).toBe(JSON.stringify(false));
    expect(localStorage.getItem('chatDirection')).toBe(JSON.stringify('LTR'));
    expect(localStorage.getItem('collapseLongUserMessages')).toBe(JSON.stringify(false));
    expect(localStorage.getItem('pasteLongTextAsFile')).toBe(JSON.stringify(false));
    expect(localStorage.getItem('centerFormOnLanding')).toBe(JSON.stringify(true));
    expect(localStorage.getItem('mobileDrawerStrip')).toBe(JSON.stringify(false));
  });

  it('preserves the four chat preferences exposed by TING settings', async () => {
    localStorage.setItem('enterToSend', JSON.stringify(false));
    localStorage.setItem('saveDrafts', JSON.stringify(false));
    localStorage.setItem('autoScroll', JSON.stringify(false));
    localStorage.setItem('showScrollButton', JSON.stringify(false));

    const { createStore } = await import('jotai');
    const { snapshot_UNSTABLE } = await import('recoil');
    const { autoScrollAtom } = await import('../autoScroll');
    const { default: settings } = await import('../settings');
    const snapshot = snapshot_UNSTABLE();

    expect(snapshot.getLoadable(settings.enterToSend).valueOrThrow()).toBe(false);
    expect(snapshot.getLoadable(settings.saveDrafts).valueOrThrow()).toBe(false);
    expect(createStore().get(autoScrollAtom)).toBe(false);
    expect(snapshot.getLoadable(settings.showScrollButton).valueOrThrow()).toBe(false);
    expect(localStorage.getItem('autoScroll')).toBe(JSON.stringify(false));
  });
});
