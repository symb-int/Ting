import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TConversation, TMessage } from 'librechat-data-provider';
import MessageParts from '~/components/Chat/Messages/MessageParts';
import ContentRender from '~/components/Messages/ContentRender';

let mockCapabilityStatus: 'configured' | 'not_configured' = 'not_configured';

const mockRegenerate = jest.fn();
const mockContinue = jest.fn();
const mockActionLabels = {
  regenerate: 'regenerate',
  continue: 'continue',
  content: 'structured content',
};
const TING_RESPONSE_ERROR =
  'TING kann gerade nicht antworten. Bitte versuchen Sie es später erneut.';

const mockConversation = {
  conversationId: 'conversation-1',
  endpoint: 'openAI',
  model: 'gpt-4.1-mini',
} as TConversation;

const mockMessage = {
  messageId: 'assistant-1',
  parentMessageId: 'user-1',
  conversationId: mockConversation.conversationId,
  isCreatedByUser: false,
  sender: 'TING',
  text: '',
  depth: 1,
  children: [],
  content: [{ type: 'text', text: 'Existing response' }],
} as TMessage;

const mockMessageActions = {
  edit: false,
  index: 0,
  agent: undefined,
  assistant: undefined,
  enterEdit: jest.fn(),
  handleScroll: jest.fn(),
  conversation: mockConversation,
  messageLabel: 'TING',
  handleFeedback: undefined,
  handleContinue: mockContinue,
  latestMessageId: mockMessage.messageId,
  copyToClipboard: jest.fn(),
  getCanCopy: () => true,
  regenerateMessage: mockRegenerate,
  latestMessageDepth: 1,
  hasConfiguredSender: true,
  isLast: true,
  isSubmitting: false,
};

jest.mock('jotai', () => ({
  atom: (initialValue: unknown) => ({ init: initialValue }),
  useAtomValue: () => false,
}));

jest.mock('recoil', () => ({
  useRecoilValue: () => false,
}));

jest.mock('~/data-provider', () => ({
  useGetStartupConfig: () => ({
    data: { chatCapability: { status: mockCapabilityStatus } },
  }),
}));

jest.mock('~/hooks', () => ({
  useAttachments: () => ({ attachments: [], searchResults: undefined }),
  useContentMetadata: () => ({ hasParallelContent: false }),
  useLocalize: () => (key: string) =>
    key === 'com_ting_response_error' ? TING_RESPONSE_ERROR : key,
  useMessageActions: () => mockMessageActions,
  useMessageHelpers: () => mockMessageActions,
}));

jest.mock('~/ting', () => ({
  useTingChatCapabilityGuard: () => {
    const ReactActual = jest.requireActual('react') as typeof React;
    const [showCapabilityError, setShowCapabilityError] = ReactActual.useState(false);

    return {
      capabilityStatus: mockCapabilityStatus,
      showCapabilityError,
      requireChatCapability: () => {
        const configured = mockCapabilityStatus !== 'not_configured';
        setShowCapabilityError(!configured);
        return configured;
      },
    };
  },
  TingStatus: ({ children, role }: { children: React.ReactNode; role?: string }) => (
    <div role={role}>{children}</div>
  ),
}));

jest.mock('~/store', () => ({
  __esModule: true,
  default: { maximizeChatSpace: {} },
}));

jest.mock('~/store/showThinking', () => ({ showThinkingAtom: {} }));

jest.mock('~/components/Chat/Messages/ui/MessageRow', () => ({
  __esModule: true,
  default: ({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) => (
    <div>
      {children}
      {footer}
    </div>
  ),
}));

jest.mock('~/components/Chat/Messages/HoverButtons', () => ({
  __esModule: true,
  default: ({
    regenerate,
    handleContinue,
  }: {
    regenerate: () => void;
    handleContinue: (event: React.MouseEvent<HTMLButtonElement>) => void;
  }) => (
    <>
      <button type="button" onClick={regenerate}>
        {mockActionLabels.regenerate}
      </button>
      <button type="button" onClick={handleContinue}>
        {mockActionLabels.continue}
      </button>
    </>
  ),
}));

jest.mock('~/components/Chat/Messages/Content/ContentParts', () => ({
  __esModule: true,
  default: () => <div>{mockActionLabels.content}</div>,
}));

jest.mock('~/components/Messages/Content/Error/source', () => ({
  ErrorSourceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('~/components/Chat/Messages/Content/Parts/AuthorHeader', () => () => null);
jest.mock('~/components/Chat/Messages/Content/ToolCallLimitNotice', () => () => null);
jest.mock('~/components/Chat/Messages/SiblingSwitch', () => () => null);
jest.mock('~/components/Chat/Messages/MessageIcon', () => () => null);
jest.mock(
  '~/components/Chat/Messages/SubRow',
  () =>
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
);
jest.mock('~/components/Chat/Messages/Elapsed', () => ({
  __esModule: true,
  default: () => null,
  shouldShowElapsed: () => false,
}));

function renderContentRender() {
  return render(
    <ContentRender
      message={mockMessage}
      siblingIdx={0}
      siblingCount={1}
      setSiblingIdx={jest.fn()}
      currentEditId={null}
      setCurrentEditId={jest.fn()}
      isSubmitting={false}
      chatContext={{ isSubmitting: false } as never}
    />,
  );
}

function renderMessageParts() {
  return render(
    <MessageParts
      message={mockMessage}
      siblingIdx={0}
      siblingCount={1}
      setSiblingIdx={jest.fn()}
      currentEditId={null}
      setCurrentEditId={jest.fn()}
    />,
  );
}

describe.each([
  ['ContentRender', renderContentRender],
  ['MessageParts', renderMessageParts],
])('%s chat capability guard', (_name, renderMessageRow) => {
  beforeEach(() => {
    mockCapabilityStatus = 'not_configured';
    mockRegenerate.mockReset();
    mockContinue.mockReset();
  });

  it('blocks structured-message actions and shows the exact TING error', () => {
    renderMessageRow();

    fireEvent.click(screen.getByRole('button', { name: mockActionLabels.regenerate }));
    fireEvent.click(screen.getByRole('button', { name: mockActionLabels.continue }));

    expect(mockRegenerate).not.toHaveBeenCalled();
    expect(mockContinue).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(TING_RESPONSE_ERROR);
  });
});
