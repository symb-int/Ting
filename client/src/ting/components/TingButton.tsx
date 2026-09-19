import React from 'react';
import { Button, cn } from '@librechat/client';
import type { ButtonProps } from '@librechat/client';

export type TingButtonVariant = 'primary' | 'secondary' | 'danger';
export type TingButtonSize = 'compact' | 'form' | 'navigation';

const variantClasses: Record<TingButtonVariant, string> = {
  primary:
    'border-accent-primary bg-accent-primary text-text-inverted hover:border-accent-primary-hover hover:bg-accent-primary-hover',
  secondary:
    'border-accent-primary bg-surface-primary text-accent-primary hover:border-accent-primary-hover hover:bg-surface-tertiary hover:text-accent-primary-hover',
  danger:
    'border-status-error bg-surface-primary text-status-error hover:border-status-error hover:bg-status-error-subtle hover:text-status-error',
};

const sizeClasses: Record<TingButtonSize, string> = {
  compact:
    'ting-button--compact min-h-8 gap-[6px] rounded-[5px] px-2 py-1 text-sm leading-[1.35] [&_svg]:size-[14px]',
  form: 'min-h-10 gap-2 rounded-[2px] px-4 py-2 text-base leading-[1.3] [&_svg]:size-5',
  navigation: 'min-h-9 gap-[6px] rounded-[5px] px-3 py-2 text-sm leading-[1.35] [&_svg]:size-4',
};

export interface TingButtonProps extends Omit<ButtonProps, 'size' | 'variant'> {
  variant?: TingButtonVariant;
  size?: TingButtonSize;
}

const TingButton = React.forwardRef<HTMLButtonElement, TingButtonProps>(
  ({ className, variant = 'primary', size = 'compact', ...props }, ref) => (
    <Button
      ref={ref}
      variant={null}
      size={null}
      shape={null}
      className={cn(
        'ting-button ting-control h-auto max-w-full whitespace-normal break-words border font-normal transition-colors focus-visible:ring-0 focus-visible:ring-offset-0',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);

TingButton.displayName = 'TingButton';

export default TingButton;
