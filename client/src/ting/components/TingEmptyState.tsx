import React from 'react';
import { cn } from '@librechat/client';

export interface TingEmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  action?: React.ReactNode;
  description?: React.ReactNode;
  title: React.ReactNode;
}

const TingEmptyState = React.forwardRef<HTMLDivElement, TingEmptyStateProps>(
  ({ action, children, className, description, title, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'ting-empty-state flex flex-col gap-2 rounded-[5px] border border-dashed border-border-medium bg-transparent p-4',
        className,
      )}
      {...props}
    >
      <p className="break-words text-sm font-bold leading-[1.45] text-text-primary">{title}</p>
      {description != null && (
        <p className="max-w-[60ch] break-words text-sm font-normal leading-[1.45] text-text-secondary">
          {description}
        </p>
      )}
      {children}
      {action != null && <div className="mt-1 flex max-w-full flex-wrap">{action}</div>}
    </div>
  ),
);

TingEmptyState.displayName = 'TingEmptyState';

export default TingEmptyState;
