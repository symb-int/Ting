import React from 'react';
import { RecoilRoot } from 'recoil';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { TConversation, TMessage } from 'librechat-data-provider';
import MessageRender from '../ui/MessageRender';

let mockCapabilityStatus: 'configured' | 'not_configured' = 'not_configured';
let mockConversation = {
  conversationId: 'conversation-1',
  endpoint: 'openAI',
  model: 'gpt-4',
} as TConversation;

const mockAsk = jest.fn();
const mockRegenerate = jest.fn();
const mockContinue = jest.fn();
const mockEditedRequest = 'edited request';
const mockActionLabels = {
  editRerun: 'edit and rerun',
  regenerate: 'regenerate',
  continue: 'continue',
};

jest.mock('~/data-provider', () => ({
  useGetStartupConfig: () => ({
    data: { chatCapability: { status: mockCapabilityStatus } },
  }),
}));

jest.mock('~/store', () => {
  const { atom } = jest.requireActual('recoil');
  return {
    __esModule: true,
    default: {
      maximizeChatSpace: atom({ key: 'message-render-capability-maximize', default: false }),
    },
  };
});

jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) => key,
  useContentMetadata: () => ({ hasParallelContent: false }),
  useMessageActions: () => ({
    ask: mockAsk,
    edit: false,
    index: 0,
    agent: undefined,
    assistant: undefined,
    enterEdit: jest.fn(),
    conversation: mockConversation,
    messageLabel: 'TING',
    handleFeedback: undefined,
    handleContinue: mockContinue,
    latestMessageId: 'assistant-1',
    copyToClipboard: jest.fn(),
    getCanCopy: () => true,
    regenerateMessage: mockRegenerate,
    latestMessageDepth: 1,
    hasConfiguredSender: true,
  }),
}));

jest.mock('~/Providers', () => {
  const React = jest.requireActual('react');
  return { MessageContext: React.createContext(null) };
});

jest.mock('~/ting', () => ({
  useTingChatCapabilityGuard: (scopeKey?: string) => {
    const ReactActual = jest.requireActual('react') as typeof React;
    const [showCapabilityError, setShowCapabilityError] = ReactActual.useState(false);

    ReactActual.useEffect(() => {
      setShowCapabilityError(false);
    }, [scopeKey]);

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

jest.mock('~/components/Chat/Messages/ui/MessageRow', () => ({
  __esModule: true,
  default: ({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) => (
    <div>
      {children}
      {footer}
    </div>
  ),
}));

jest.mock('~/components/Chat/Messages/Content/MessageContent', () => ({
  __esModule: true,
  default: ({ ask }: { ask: (message: { text: string }) => false | void }) => (
    <button type="button" onClick={() => ask({ text: mockEditedRequest })}>
      {mockActionLabels.editRerun}
    </button>
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

jest.mock('~/components/Chat/Messages/SiblingSwitch', () => () => null);
jest.mock('~/components/Chat/Messages/MessageIcon', () => () => null);
jest.mock('~/components/Chat/Messages/Content/Wakeup', () => () => null);
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

const createMessage = (
  conversationId = mockConversation.conversationId,
  messageId = 'assistant-1',
) =>
  ({
    messageId,
    conversationId,
    parentMessageId: 'user-1',
    isCreatedByUser: false,
    sender: 'TING',
    text: 'Existing response',
    depth: 1,
    children: [],
  }) as TMessage;

const renderMessage = (message = createMessage()) =>
  render(
    <RecoilRoot>
      <MessageRender
        message={message}
        siblingIdx={0}
        siblingCount={1}
        setSiblingIdx={jest.fn()}
        currentEditId={null}
        setCurrentEditId={jest.fn()}
        isSubmitting={false}
        chatContext={{ isSubmitting: false } as never}
      />
    </RecoilRoot>,
  );

describe('MessageRender chat capability guard', () => {
  beforeEach(() => {
    mockCapabilityStatus = 'not_configured';
    mockConversation = {
      conversationId: 'conversation-1',
      endpoint: 'openAI',
      model: 'gpt-4',
    } as TConversation;
    mockAsk.mockReset();
    mockRegenerate.mockReset();
    mockContinue.mockReset();
  });

  it('blocks edit-rerun, regenerate, and continue without creating a model request', () => {
    renderMessage();

    fireEvent.click(screen.getByRole('button', { name: mockActionLabels.editRerun }));
    fireEvent.click(screen.getByRole('button', { name: mockActionLabels.regenerate }));
    fireEvent.click(screen.getByRole('button', { name: mockActionLabels.continue }));

    expect(mockAsk).not.toHaveBeenCalled();
    expect(mockRegenerate).not.toHaveBeenCalled();
    expect(mockContinue).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('com_ting_response_error');
  });

  it('clears a blocked-action error when the conversation changes', async () => {
    const { rerender } = renderMessage();
    fireEvent.click(screen.getByRole('button', { name: mockActionLabels.regenerate }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    mockConversation = {
      ...mockConversation,
      conversationId: 'conversation-2',
    };
    rerender(
      <RecoilRoot>
        <MessageRender
          message={createMessage('conversation-2', 'assistant-2')}
          siblingIdx={0}
          siblingCount={1}
          setSiblingIdx={jest.fn()}
          currentEditId={null}
          setCurrentEditId={jest.fn()}
          isSubmitting={false}
          chatContext={{ isSubmitting: false } as never}
        />
      </RecoilRoot>,
    );

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('keeps native message actions enabled when chat is configured', () => {
    mockCapabilityStatus = 'configured';
    renderMessage();

    fireEvent.click(screen.getByRole('button', { name: mockActionLabels.editRerun }));
    fireEvent.click(screen.getByRole('button', { name: mockActionLabels.regenerate }));
    fireEvent.click(screen.getByRole('button', { name: mockActionLabels.continue }));

    expect(mockAsk).toHaveBeenCalledTimes(1);
    expect(mockRegenerate).toHaveBeenCalledTimes(1);
    expect(mockContinue).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
