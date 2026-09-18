import React, { Profiler, useMemo, useState } from 'react';
import '@testing-library/jest-dom';
import { DndProvider } from 'react-dnd';
import { useForm } from 'react-hook-form';
import { RecoilRoot, useRecoilState } from 'recoil';
import userEvent from '@testing-library/user-event';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryKeys, FileSources, EModelEndpoint } from 'librechat-data-provider';
import type { TFile, TFileUpload, TConversation, TChatProject } from 'librechat-data-provider';
import type { ChatFormValues } from '~/common';
import ChatForm, { toRestoredComposerFile } from '../ChatForm';
import { ChatContext, ChatFormProvider } from '~/Providers';
import { AuthContextProvider } from '~/hooks/AuthContext';
import store from '~/store';

const mockUpload = jest.fn();
const mockAsk = jest.fn();

jest.mock('librechat-data-provider', () => {
  const actual = jest.requireActual('librechat-data-provider');
  return {
    ...actual,
    dataService: {
      ...actual.dataService,
      uploadImage: (...args: unknown[]) => mockUpload(...args),
      uploadFile: (...args: unknown[]) => mockUpload(...args),
    },
  };
});

const conversation = {
  conversationId: 'new',
  endpoint: EModelEndpoint.openAI,
  model: 'gpt-4o',
  title: 'New Chat',
} as TConversation;

const uploadResponse = {
  message: 'File uploaded',
  file_id: 'server-file-id',
  temp_file_id: 'temp-file-id',
  filename: 'cat.png',
  filepath: '/images/cat.png',
  type: 'image/png',
  bytes: 2048,
  height: 100,
  width: 100,
  source: FileSources.local,
  embedded: false,
} as unknown as TFileUpload;

/** jsdom never decodes images; `decodes` mirrors a browser that can or cannot. */
let decodes = true;

class StubImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 100;
  height = 100;
  set src(_value: string) {
    setTimeout(() => (decodes ? this.onload?.() : this.onerror?.()), 0);
  }
}

let commits = 0;

function Harness({ project }: { project?: TChatProject }) {
  const [files, setFiles] = useRecoilState(store.filesByIndex(0));
  const [isSubmitting] = useRecoilState(store.isSubmittingFamily(0));
  const [, setFilesLoading] = useState(false);
  const methods = useForm<ChatFormValues>({ defaultValues: { text: '' } });

  const chatHelpers = useMemo(
    () =>
      ({
        index: 0,
        conversation,
        setConversation: () => undefined,
        files,
        setFiles,
        isSubmitting,
        setIsSubmitting: () => undefined,
        filesLoading: false,
        setFilesLoading,
        newConversation: () => undefined,
        handleStopGenerating: () => undefined,
        stopGenerating: () => undefined,
        getMessages: () => undefined,
        setMessages: () => undefined,
        ask: (...args: unknown[]) => mockAsk(...args),
        regenerate: () => undefined,
        setSiblingIdx: () => undefined,
        showPopover: false,
        setShowPopover: () => undefined,
        abortScroll: false,
        setAbortScroll: () => undefined,
        preset: null,
        setPreset: () => undefined,
        optionSettings: {},
        setOptionSettings: () => undefined,
        handleRegenerate: () => undefined,
        handleContinue: () => undefined,
      }) as unknown as React.ContextType<typeof ChatContext>,
    [files, setFiles, isSubmitting],
  );

  return (
    <ChatFormProvider {...methods}>
      <ChatContext.Provider value={chatHelpers}>
        <Profiler id="composer" onRender={() => (commits += 1)}>
          <ChatForm
            index={0}
            project={project}
            isLandingPage={false}
            footerBelow={false}
            centerFormOnLanding={false}
          />
        </Profiler>
      </ChatContext.Provider>
    </ChatFormProvider>
  );
}

function renderComposer({
  submitting = false,
  quotes = [],
  chatCapability,
  project,
}: {
  submitting?: boolean;
  quotes?: string[];
  chatCapability?: 'configured' | 'not_configured';
  project?: TChatProject;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  /* These interaction tests exercise the destination menu. Unified-mode control
   * behavior has its own focused coverage, so opt this harness into the legacy menu
   * instead of depending on the product default. */
  queryClient.setQueryData([QueryKeys.fileConfig], {
    endpoints: { default: { legacyFileUploadUX: true } },
  });
  queryClient.setQueryData<TFile[]>([QueryKeys.files], []);
  queryClient.setQueryData([QueryKeys.endpoints], { [EModelEndpoint.openAI]: { order: 0 } });
  if (chatCapability) {
    queryClient.setQueryData([QueryKeys.startupConfig, false, 'default'], {
      chatCapability: { status: chatCapability },
    });
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <RecoilRoot
        initializeState={({ set }) => {
          set(store.isSubmittingFamily(0), submitting);
          set(store.showStopButtonByIndex(0), submitting);
          set(store.pendingQuotesByConvoId(conversation.conversationId ?? ''), quotes);
        }}
      >
        <Router>
          <AuthContextProvider authConfig={{ loginRedirect: '', test: true }}>
            <DndProvider backend={HTML5Backend}>
              <Harness project={project} />
            </DndProvider>
          </AuthContextProvider>
        </Router>
      </RecoilRoot>
    </QueryClientProvider>,
  );
}

const sendButton = () => screen.getByTestId('send-button');
const attach = (container: HTMLElement, file: File) =>
  userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement, file);
const image = () => new File(['image-bytes'], 'cat.png', { type: 'image/png' });

describe('ChatForm attachments', () => {
  beforeEach(() => {
    localStorage.clear();
    decodes = true;
    commits = 0;
    global.URL.createObjectURL = jest.fn(() => 'blob:preview');
    global.URL.revokeObjectURL = jest.fn();
    (global as unknown as { Image: unknown }).Image = StubImage;
    mockUpload.mockReset();
    mockAsk.mockReset();
    /** The server echoes the id the client sent back as `temp_file_id`. */
    mockUpload.mockImplementation((body: FormData) =>
      Promise.resolve({ ...uploadResponse, temp_file_id: body.get('file_id') as string }),
    );
  });

  test('preserves extracted-text delivery when restoring a queued attachment', () => {
    expect(
      toRestoredComposerFile({
        file_id: 'stored-doc',
        filename: 'report.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        llmDeliveryPath: 'text',
      }),
    ).toMatchObject({
      file_id: 'stored-doc',
      filename: 'report.docx',
      progress: 1,
      attached: true,
      llmDeliveryPath: 'text',
    });
  });

  test('re-enables send once an attachment finishes uploading', async () => {
    const { container } = renderComposer();

    const textarea = await screen.findByTestId('text-input');
    await userEvent.type(textarea, 'hi');
    expect(sendButton()).toBeEnabled();

    await attach(container, image());
    await waitFor(() => expect(mockUpload).toHaveBeenCalled());

    await waitFor(() => expect(sendButton()).toBeEnabled());
    expect(textarea).toHaveValue('hi');
  }, 20000);

  test('does not steal focus when clicking the nested attachment icon', async () => {
    renderComposer();
    const textarea = await screen.findByTestId('text-input');
    const trigger = screen.getByRole('button', { name: 'Attach File Options' });
    expect(trigger).toBeEnabled();
    const icon = trigger.querySelector('svg');
    expect(icon).not.toBeNull();
    const focus = jest.spyOn(textarea, 'focus');

    await userEvent.click(icon as SVGElement);

    expect(focus).not.toHaveBeenCalled();
    expect(await screen.findByRole('menu', { name: 'Attach File Options' })).toBeInTheDocument();
  }, 20000);

  test('closes an open menu when the textarea is clicked', async () => {
    renderComposer();
    const textarea = await screen.findByTestId('text-input');
    await userEvent.click(screen.getByRole('button', { name: 'Attach File Options' }));
    expect(await screen.findByRole('menu', { name: 'Attach File Options' })).toBeInTheDocument();

    await userEvent.click(textarea);

    await waitFor(() =>
      expect(screen.queryByRole('menu', { name: 'Attach File Options' })).not.toBeInTheDocument(),
    );
    expect(textarea).toHaveFocus();
  }, 20000);

  test('still returns focus to the textarea after a plain control click', async () => {
    renderComposer();
    const textarea = await screen.findByTestId('text-input');
    await userEvent.type(textarea, 'hi');
    expect(sendButton()).toBeEnabled();

    await userEvent.click(sendButton());

    expect(textarea).toHaveFocus();
  }, 20000);

  test('keeps the draft and shows the shared error when chat is not configured', async () => {
    renderComposer({ chatCapability: 'not_configured' });
    const textarea = await screen.findByTestId('text-input');
    await userEvent.type(textarea, 'Mein Anliegen');

    await userEvent.click(sendButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('TING');
    expect(textarea).toHaveValue('Mein Anliegen');
    expect(mockAsk).not.toHaveBeenCalled();
  }, 20000);

  test('keeps stop available instead of exposing during-run send actions', async () => {
    renderComposer({ submitting: true });
    const textarea = await screen.findByTestId('text-input');
    await userEvent.type(textarea, 'later');

    expect(screen.getByTestId('stop-generation-button')).toBeEnabled();
    expect(screen.queryByTestId('during-run-send-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('interrupt-steer-button')).not.toBeInTheDocument();

    const enterCases = [
      {},
      { ctrlKey: true },
      { metaKey: true },
      { ctrlKey: true, shiftKey: true },
      { metaKey: true, shiftKey: true },
      { altKey: true },
    ];
    for (const modifiers of enterCases) {
      fireEvent.keyDown(textarea, { key: 'Enter', ...modifiers });
    }
    fireEvent.submit(textarea.closest('form') as HTMLFormElement);

    expect(textarea).toHaveValue('later');
    expect(mockAsk).not.toHaveBeenCalled();
    expect(screen.getByTestId('stop-generation-button')).toBeInTheDocument();
  }, 20000);

  test('does not expose selection or composer quote UI from persisted quote state', async () => {
    renderComposer({ quotes: ['alpha', 'beta'] });

    await screen.findByTestId('text-input');

    expect(screen.queryByTestId('add-to-chat-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pending-quote-chips')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '2 selections' })).not.toBeInTheDocument();
  });

  test('does not restore the project landing control from a legacy project state', async () => {
    renderComposer({
      project: {
        _id: 'legacy-project',
        name: 'Legacy project',
      } as TChatProject,
    });

    await screen.findByTestId('text-input');

    expect(screen.queryByText('Legacy project')).not.toBeInTheDocument();
    expect(screen.queryByTestId('composer-context-rail')).not.toBeInTheDocument();
  });

  test('focuses the textarea when clicking empty composer space', async () => {
    renderComposer();
    const textarea = await screen.findByTestId('text-input');
    const surface = screen.getByTestId('composer-surface');
    const focus = jest.spyOn(textarea, 'focus');

    fireEvent.click(surface);

    expect(focus).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveFocus();
  }, 20000);

  test('enables send for an attachment with no composer text', async () => {
    const { container } = renderComposer();
    await screen.findByTestId('text-input');
    expect(sendButton()).toBeDisabled();

    await attach(container, image());
    await waitFor(() => expect(mockUpload).toHaveBeenCalled());

    await waitFor(() => expect(sendButton()).toBeEnabled());
  }, 20000);

  /**
   * The upload only starts once the browser has decoded the image. A decode it
   * refuses used to leave the attachment below `progress: 1`, which reads as
   * "still uploading" and disabled the send button for the rest of the session.
   */
  test('drops an image the browser cannot decode instead of disabling send', async () => {
    decodes = false;
    const { container } = renderComposer();

    const textarea = await screen.findByTestId('text-input');
    await userEvent.type(textarea, 'hi');

    await attach(container, image());
    await waitFor(() => expect(screen.queryByLabelText('Remove file')).not.toBeInTheDocument());

    expect(mockUpload).not.toHaveBeenCalled();
    expect(sendButton()).toBeEnabled();
    expect(textarea).toHaveValue('hi');
  }, 20000);

  /**
   * The composer is the app's busiest surface: every keystroke already re-renders
   * it for the row count and the send button's enabled state, so anything that
   * multiplies that work per character is a regression worth failing on. The
   * measured cost is ~2.5 commits per character (react-scan reports one ChatForm
   * render per keystroke in a real browser); the bound leaves headroom for jsdom
   * scheduling without tolerating a doubling.
   */
  test('keeps typing render-bounded', async () => {
    renderComposer();
    const textarea = await screen.findByTestId('text-input');
    await waitFor(() => expect(sendButton()).toBeInTheDocument());

    commits = 0;
    await userEvent.type(textarea, 'hello there');

    expect(commits).toBeLessThanOrEqual('hello there'.length * 3);
  }, 20000);
});
