import type { ReactNode } from 'react';
import { cn } from '~/utils';

interface SectionProps {
  heading: string;
  icon?: ReactNode;
  danger?: boolean;
  children: ReactNode;
}

export default function Section({ heading, icon, danger, children }: SectionProps) {
  return (
    <section className="mb-6 last:mb-0">
      <h3
        className={cn(
          'mb-3 flex items-center gap-1.5 text-sm font-bold leading-[1.45]',
          danger ? 'text-text-destructive' : 'text-text-secondary',
        )}
      >
        {icon}
        {heading}
      </h3>
      <div className="flex flex-col gap-4 text-sm leading-[1.45] text-text-primary">{children}</div>
    </section>
  );
}
