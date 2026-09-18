import { memo } from 'react';
import { useParams } from 'react-router-dom';
import { Constants } from 'librechat-data-provider';
import { useChatContext } from '~/Providers';
import { OpenSidebar } from './Menus';
import { useLocalize } from '~/hooks';

function Header({
  parentConversationId: _parentConversationId,
  readOnly: _readOnly = false,
}: {
  parentConversationId?: string;
  readOnly?: boolean;
}) {
  const localize = useLocalize();
  const { conversation } = useChatContext();
  const { conversationId } = useParams();
  const isNewCase = !conversationId || conversationId === Constants.NEW_CONVO;
  const conversationTitle =
    conversation?.conversationId === conversationId ? conversation?.title?.trim() : undefined;
  const title = isNewCase || !conversationTitle ? localize('com_ting_new_case') : conversationTitle;

  return (
    <header className="ting-chat-header">
      <div className="ting-chat-header__menu">
        <OpenSidebar testId="header-open-sidebar-button" />
      </div>
      <div className="ting-chat-header__copy">
        {isNewCase ? (
          <div className="ting-chat-header__title">{title}</div>
        ) : (
          <h1 className="ting-chat-header__title">{title}</h1>
        )}
        <div className="ting-chat-header__subtitle">{localize('com_ting_chat_subtitle')}</div>
      </div>
    </header>
  );
}

export default memo(Header);
