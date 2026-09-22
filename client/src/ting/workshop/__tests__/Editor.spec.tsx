import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { request } from 'librechat-data-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewProcedure } from '../Editor';

jest.mock('~/hooks', () => ({ useLocalize: () => (key: string) => key }));
jest.mock('~/hooks/AuthContext', () => ({
  useAuthContext: () => ({ user: { id: 'operator-1' }, isAuthenticated: true }),
}));

function openEditor() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    logger: { log: console.log, warn: console.warn, error: () => undefined },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/werkstatt/verfahren/neu']}>
        <NewProcedure />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function submit(label: string) {
  const button = screen.getByRole('button', { name: label });
  const form = button.closest('form');
  if (!form) throw new Error('Expected procedure form.');
  fireEvent(
    form,
    new SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: button }),
  );
}

describe('Procedure editor mutation boundary', () => {
  beforeEach(() => {
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('83a42d74-5ab3-4210-9224-55ee52170d90');
  });

  it('permits an empty description in a draft and rejects publishing it', async () => {
    const post = jest.spyOn(request, 'post').mockRejectedValue(new Error('connection lost'));
    openEditor();
    fireEvent.change(screen.getByLabelText(/com_ting_title/), {
      target: { value: '  Wohngeld  ' },
    });
    submit('com_ting_publish');
    expect(screen.getByText('com_ting_description_publish_error')).toBeVisible();
    expect(post).not.toHaveBeenCalled();
    submit('com_ting_save_draft');
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1]).toEqual({
      title: 'Wohngeld',
      description: '',
      intent: 'save',
      requestId: '83a42d74-5ab3-4210-9224-55ee52170d90',
    });
    await screen.findByText('com_ting_save_error');
  });

  it('retains both inputs and reuses the request ID when retrying a failed publication', async () => {
    const post = jest.spyOn(request, 'post').mockRejectedValue(new Error('connection lost'));
    const uuid = jest.spyOn(crypto, 'randomUUID');
    openEditor();
    fireEvent.change(screen.getByLabelText(/com_ting_title/), { target: { value: 'Wohngeld' } });
    fireEvent.change(screen.getByLabelText(/com_ting_description/), {
      target: { value: 'Hilfe bei Mietkosten.' },
    });
    submit('com_ting_publish');
    await screen.findByText('com_ting_save_error');
    expect(screen.getByLabelText(/com_ting_title/)).toHaveValue('Wohngeld');
    expect(screen.getByLabelText(/com_ting_description/)).toHaveValue('Hilfe bei Mietkosten.');
    submit('com_ting_publish');
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[1][1]).toEqual(post.mock.calls[0][1]);
    expect(uuid).toHaveBeenCalledTimes(1);
    await screen.findByText('com_ting_save_error');
  });

  it('does not submit a second request while the first is unresolved', async () => {
    let rejectRequest: (reason: Error) => void = () => undefined;
    const post = jest.spyOn(request, 'post').mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        }),
    );
    openEditor();
    fireEvent.change(screen.getByLabelText(/com_ting_title/), { target: { value: 'Wohngeld' } });
    submit('com_ting_save_draft');
    submit('com_ting_save_draft');
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    rejectRequest(new Error('connection lost'));
    await screen.findByText('com_ting_save_error');
  });

  it('retains creation identity when the delivery is uncertain and the inputs are edited', async () => {
    const post = jest.spyOn(request, 'post').mockRejectedValue(new Error('connection lost'));
    const uuid = jest.spyOn(crypto, 'randomUUID');
    openEditor();
    fireEvent.change(screen.getByLabelText(/com_ting_title/), {
      target: { value: 'Wohngeld' },
    });
    submit('com_ting_save_draft');
    await screen.findByText('com_ting_save_error');
    fireEvent.change(screen.getByLabelText(/com_ting_title/), {
      target: { value: 'Wohnkostenzuschuss' },
    });
    submit('com_ting_save_draft');
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[1][1].requestId).toBe(post.mock.calls[0][1].requestId);
    expect(uuid).toHaveBeenCalledTimes(1);
    await screen.findByText('com_ting_save_error');
  });
});
