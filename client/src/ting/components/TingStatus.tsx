import React from 'react';
import { Alert, cn } from '@librechat/client';
import type { AlertProps } from '@librechat/client';

export type TingStatusVariant = 'error' | 'success' | 'warning' | 'neutral' | 'info';

export interface TingStatusProps extends Omit<AlertProps, 'title' | 'variant'> {
  title?: React.ReactNode;
  variant?: TingStatusVariant;
}

const TingStatus = React.forwardRef<HTMLDivElement, TingStatusProps>(
  ({ children, className, title, variant = 'neutral', ...props }, ref) => (
    <Alert
      ref={ref}
      variant={variant}
      className={cn(
        'ting-status gap-2 rounded-[8px] p-3 text-sm leading-[1.45] shadow-none [&>span>svg]:size-[18px] [&>span]:mt-0',
        className,
      )}
      {...props}
    >
      {title != null && <p className="font-bold text-current">{title}</p>}
      {children != null && <div className={cn(title != null && 'mt-1')}>{children}</div>}
    </Alert>
  ),
);

TingStatus.displayName = 'TingStatus';

export default TingStatus;
