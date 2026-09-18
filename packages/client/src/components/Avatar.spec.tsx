import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TUser } from 'librechat-data-provider';
import Avatar from './Avatar';

const user = { name: '  Alex   Maria Beispiel  ', username: 'alex' } as TUser;

describe('Avatar', () => {
  it('renders initials directly and updates them when the account changes', () => {
    const { rerender, container } = render(<Avatar user={user} size={36} />);

    expect(screen.getByText('AB')).toBeVisible();
    expect(container.querySelector('img')).toBeNull();

    rerender(<Avatar user={{ ...user, name: 'Nicole da Costa' }} size={36} />);
    expect(screen.getByText('NC')).toBeVisible();
    expect(screen.queryByText('AB')).not.toBeInTheDocument();

    rerender(<Avatar user={{ ...user, name: '', username: 'raphael' }} size={36} />);
    expect(screen.queryByText('NC')).not.toBeInTheDocument();
    expect(screen.queryByText('R')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('preserves uploaded images and recovers when a failed image is replaced', () => {
    const { rerender, container } = render(
      <Avatar user={{ ...user, avatar: '/images/first.png' }} alt="Profilbild" />,
    );
    const firstImage = container.querySelector('img')!;
    expect(firstImage).toHaveAttribute('src', '/images/first.png');
    fireEvent.error(firstImage);
    expect(screen.getByText('AB')).toBeVisible();

    rerender(<Avatar user={{ ...user, avatar: '/images/second.png' }} alt="Profilbild" />);
    const secondImage = container.querySelector('img')!;
    expect(secondImage).toHaveAttribute('src', '/images/second.png');
    fireEvent.load(secondImage);
    expect(screen.getByRole('img', { name: 'Profilbild' })).toBeVisible();
    expect(screen.queryByText('AB')).not.toBeInTheDocument();

    rerender(<Avatar user={{ ...user, avatar: '' }} alt="Profilbild" />);
    expect(screen.getByText('AB')).toBeVisible();
  });

  it('does not reuse the loaded state for a different image', () => {
    const { rerender, container } = render(
      <Avatar user={{ ...user, avatar: '/images/first.png' }} />,
    );
    fireEvent.load(container.querySelector('img')!);
    rerender(<Avatar user={{ ...user, avatar: '/images/second.png' }} />);
    expect(container.querySelector('img')).not.toBeVisible();
    fireEvent.load(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeVisible();
  });

  it('honors the option to hide an empty or failed fallback', () => {
    const { rerender, container } = render(<Avatar showDefaultWhenEmpty={false} />);
    expect(container).toBeEmptyDOMElement();

    rerender(
      <Avatar user={{ ...user, avatar: '/images/failed.png' }} showDefaultWhenEmpty={false} />,
    );
    fireEvent.error(container.querySelector('img')!);
    expect(container).toBeEmptyDOMElement();
  });
});
