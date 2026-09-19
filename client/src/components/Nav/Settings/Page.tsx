import { useEffect, useRef } from 'react';
import { Avatar } from '@librechat/client';
import { SettingsTabValues } from 'librechat-data-provider';
import { OpenSidebar } from '~/components/Chat/Menus';
import { useAuthContext, useLocalize } from '~/hooks';
import { useSettingsContext } from './context';
import Content from './Content';

/** Account settings are a route inside the authenticated shell, like the reference account view. */
export default function SettingsPage() {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const ctx = useSettingsContext();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className="ting-support-workspace" aria-labelledby="settings-title">
      <div className="ting-support-mobile-header">
        <OpenSidebar testId="settings-open-sidebar-button" />
        <span>{localize('com_ui_ting_wordmark')}</span>
      </div>
      <div className="ting-support-page">
        <header className="ting-support-heading">
          <h1 id="settings-title" ref={headingRef} tabIndex={-1}>
            {localize('com_ting_account')}
          </h1>
          <div className="ting-account-identity">
            <Avatar user={user} size={36} />
            <div>
              <strong>{user?.name ?? user?.username}</strong>
              <p>{user?.email}</p>
            </div>
          </div>
        </header>
        <Content activeTab={SettingsTabValues.ACCOUNT} query="" ctx={ctx} />
        <Content activeTab={SettingsTabValues.CHAT} query="" ctx={ctx} />
      </div>
    </main>
  );
}
