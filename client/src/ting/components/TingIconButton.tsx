import React from 'react';
import { IconButton, cn } from '@librechat/client';
import type { IconButtonProps } from '@librechat/client';

export type TingIconButtonVariant = 'quiet' | 'send';

const variantClasses: Record<TingIconButtonVariant, string> = {
  quiet:
    'border-0 bg-transparent text-text-secondary hover:bg-surface-secondary hover:text-text-primary',
  send: 'rounded-[8px] border border-accent-primary bg-accent-primary text-text-inverted hover:border-accent-primary-hover hover:bg-accent-primary-hover hover:text-text-inverted',
};

export interface TingIconButtonProps extends Omit<IconButtonProps, 'shape' | 'size' | 'variant'> {
  variant?: TingIconButtonVariant;
}

const TingIconButton = React.forwardRef<HTMLButtonElement, TingIconButtonProps>(
  ({ className, variant = 'quiet', ...props }, ref) => (
    <IconButton
      ref={ref}
      variant={null}
      size={null}
      shape={null}
      className={cn(
        'ting-icon-button ting-control size-[30px] rounded-[5px] p-[6px] transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 [&_svg]:size-[18px]',
        variantClasses[variant],
        variant === 'send' && '[&_svg]:size-[17px]',
        className,
      )}
      {...props}
    />
  ),
);

TingIconButton.displayName = 'TingIconButton';

export default TingIconButton;
