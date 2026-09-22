import { act, renderHook } from '@testing-library/react';
import { useGetLatestMessage } from '~/hooks/Messages/useLatestMessage';
import useChatCapabilityGuard from '../../hooks/useChatCapabilityGuard';
import useTingActionSubmission from '../useSubmission';
import { useChatContext } from '~/Providers';

jest.mock('~/Providers', () => ({ useChatContext: jest.fn() }));
jest.mock('~/hooks/Messages/useLatestMessage', () => ({ useGetLatestMessage: jest.fn() }));
jest.mock('../../hooks/useChatCapabilityGuard', () => ({ __esModule: true, default: jest.fn() }));

const ask = jest.fn();
const latest = jest.fn();
const capability = jest.fn();

beforeEach(() => {
  ask.mockReset();
  latest.mockReset();
  capability.mockReset().mockReturnValue(true);
  (useChatContext as jest.Mock).mockReturnValue({
    ask,
    index: 0,
    isSubmitting: false,
    conversation: { conversationId: 'new' },
  });
  (useGetLatestMessage as jest.Mock).mockReturnValue(latest);
  (useChatCapabilityGuard as jest.Mock).mockReturnValue({
    requireChatCapability: capability,
    showCapabilityError: false,
  });
});

describe('native TING action submission', () => {
  it('selects a published revision without requiring a model and excludes composer content', () => {
    capability.mockReturnValue(false);
    const { result } = renderHook(() => useTingActionSubmission());
    act(() => {
      result.current.submit(
        { type: 'select_procedure', procedureId: 'p', revisionId: 'r' },
        'Begin this procedure',
      );
    });
    expect(capability).not.toHaveBeenCalled();
    const [message, options] = ask.mock.calls[0];
    expect(message).toEqual({ text: 'Begin this procedure' });
    expect(options).toEqual({
      tingAction: {
        type: 'select_procedure',
        procedureId: 'p',
        revisionId: 'r',
        requestId: options.overrideClientRequestId,
      },
      overrideClientRequestId: expect.any(String),
      overrideFiles: [],
      overrideQuotes: [],
      overrideManualSkills: [],
    });
  });

  it('binds a reply to its exact source turn and ignores a rapid duplicate click', () => {
    latest.mockReturnValue({ messageId: 'a1' });
    const { result } = renderHook(() => useTingActionSubmission());
    act(() => {
      const action = { type: 'reply' as const, actionId: 'choice', sourceMessageId: 'a1' };
      result.current.submit(action, 'At home');
      result.current.submit(action, 'At home');
    });
    expect(ask).toHaveBeenCalledTimes(1);
    expect(ask.mock.calls[0][0]).toEqual({ text: 'At home', parentMessageId: 'a1' });
    expect(result.current.pending).toBe(true);
  });

  it('refuses an action whose branch changed before the click', () => {
    latest.mockReturnValue({ messageId: 'another-branch' });
    const { result } = renderHook(() => useTingActionSubmission());
    act(() => {
      result.current.submit(
        { type: 'reply', actionId: 'choice', sourceMessageId: 'a1' },
        'At home',
      );
    });
    expect(ask).not.toHaveBeenCalled();
    expect(result.current.submissionError).toBe(true);
  });

  it('releases the local lock after admission is refused', () => {
    ask.mockReturnValue(false);
    const { result } = renderHook(() => useTingActionSubmission());
    act(() => {
      result.current.submit(
        { type: 'select_procedure', procedureId: 'p', revisionId: 'r' },
        'Start',
      );
    });
    expect(result.current.pending).toBe(false);
    expect(result.current.submissionError).toBe(true);
  });
});
