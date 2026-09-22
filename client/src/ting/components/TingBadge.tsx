import React from 'react';
import { cn } from '@librechat/client';

export interface TingBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success';
}

export default function TingBadge({ variant = 'neutral', className, ...props }: TingBadgeProps) {
  return (
    <span
      className={cn(
        'ting-badge inline-flex items-center gap-[6px] whitespace-nowrap rounded-[2px] px-2 py-1 text-xs font-bold leading-[1.4]',
        variant === 'success'
          ? 'bg-status-success-subtle text-status-success'
          : 'bg-surface-secondary text-text-secondary',
        className,
      )}
      {...props}
    />
  );
}
