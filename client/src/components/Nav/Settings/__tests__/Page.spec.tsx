import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { SettingsPage } from '../index';

// This unit test isolates the route frame. The real controls are covered by the browser flow.
jest.mock('../Content', () => jest.fn(() => <div data-testid="settings-content" />));
jest.mock('../context', () => ({ useSettingsContext: () => ({}) }));
jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) => key,
  useAuthContext: () => ({ user: { name: 'Account', email: 'account@example.org' } }),
}));
jest.mock('~/components/Chat/Menus', () => ({ OpenSidebar: () => null }));

describe('SettingsPage', () => {
  it('renders a focused page heading and both settings groups, without a dialog', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsPage />
      </MemoryRouter>,
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveFocus();
    expect(screen.getByRole('main')).toHaveAttribute('aria-labelledby', heading.id);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('settings-content')).toHaveLength(2);
  });

  it('shows the signed-in account identity', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('account@example.org')).toBeVisible();
  });
});
