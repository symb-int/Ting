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
    <section className="ting-account-section">
      <h2
        className={cn(
          'flex items-center gap-1.5 font-bold',
          danger ? 'text-text-destructive' : 'text-text-primary',
        )}
      >
        {icon}
        {heading}
      </h2>
      <div className="ting-settings-rows">{children}</div>
    </section>
  );
}
