describe('TING temporary-chat normalization', () => {
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
  });

  it('discards legacy temporary-chat preferences before the authenticated UI mounts', async () => {
    localStorage.setItem('isTemporary', JSON.stringify(true));
    localStorage.setItem('defaultTemporaryChat', JSON.stringify(true));

    const { snapshot_UNSTABLE } = await import('recoil');
    const temporaryStore = (await import('../temporary')).default;
    const snapshot = snapshot_UNSTABLE();

    expect(snapshot.getLoadable(temporaryStore.isTemporary).valueOrThrow()).toBe(false);
    expect(snapshot.getLoadable(temporaryStore.defaultTemporaryChat).valueOrThrow()).toBe(false);
    expect(localStorage.getItem('isTemporary')).toBe(JSON.stringify(false));
    expect(localStorage.getItem('defaultTemporaryChat')).toBe(JSON.stringify(false));
  });
});
