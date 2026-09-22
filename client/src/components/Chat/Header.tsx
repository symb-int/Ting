import { memo } from 'react';
import { OpenSidebar } from './Menus';

function Header({
  parentConversationId: _parentConversationId,
  readOnly: _readOnly = false,
}: {
  parentConversationId?: string;
  readOnly?: boolean;
}) {
  return (
    <header className="ting-chat-header ting-chat-header--navigation-only">
      <div className="ting-chat-header__menu">
        <OpenSidebar testId="header-open-sidebar-button" />
      </div>
    </header>
  );
}

export default memo(Header);
