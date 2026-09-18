import { render, screen } from '@testing-library/react';
import ConvoLink from '../ConvoLink';

const localize = (key: string) => key;

describe('ConvoLink', () => {
  it('clips a long title to one line with a native ellipsis and no reveal mask', () => {
    const title = 'Ein sehr langer Vorgangstitel, der breiter als die Navigationszeile ist';
    render(
      <ConvoLink
        isActiveConvo={false}
        isPopoverActive={false}
        isSharedBadgeVisible={false}
        title={title}
        onRename={jest.fn()}
        isSmallScreen={false}
        localize={localize}
      >
        <span aria-hidden="true">T</span>
      </ConvoLink>,
    );

    const titleElement = screen.getByText(title);
    expect(titleElement).toHaveClass(
      'min-w-0',
      'overflow-hidden',
      'text-ellipsis',
      'whitespace-nowrap',
    );
    expect(titleElement.className).not.toContain('mask');
    expect(titleElement).not.toHaveAttribute('data-title-revealed');
  });
});
