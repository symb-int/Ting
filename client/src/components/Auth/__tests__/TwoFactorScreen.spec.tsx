import { MemoryRouter } from 'react-router-dom';
import { ErrorTypes } from 'librechat-data-provider';
import { act, render, screen } from '@testing-library/react';
import TwoFactorScreen from '../TwoFactorScreen';

let mockVerifyOptions: { onError: (error: unknown) => void } | undefined;

jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) => key,
}));

jest.mock('~/data-provider', () => ({
  useVerifyTwoFactorTempMutation: (options: { onError: (error: unknown) => void }) => {
    mockVerifyOptions = options;
    return { mutate: jest.fn() };
  },
}));

function renderScreen() {
  render(
    <MemoryRouter initialEntries={['/login/2fa?tempToken=temp-token']}>
      <TwoFactorScreen />
    </MemoryRouter>,
  );
}

describe('TwoFactorScreen verification errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyOptions = undefined;
  });

  it('shows a localized message when the server rejects a cross-origin submission', () => {
    renderScreen();

    act(() => {
      mockVerifyOptions?.onError({
        response: {
          data: { message: 'Cross-site request rejected', code: ErrorTypes.AUTH_CROSS_ORIGIN },
        },
      });
    });

    expect(screen.getByRole('alert')).toHaveTextContent('com_auth_error_login_cross_origin');
  });

  it('shows a localized generic message for other verification failures', () => {
    renderScreen();

    act(() => {
      mockVerifyOptions?.onError({
        response: { data: { message: 'Invalid 2FA code or backup code' } },
      });
    });

    expect(screen.getByRole('alert')).toHaveTextContent('com_auth_error_login');
  });
});
