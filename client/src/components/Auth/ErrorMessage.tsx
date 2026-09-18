import { TingStatus } from '~/ting';

export const ErrorMessage = ({
  children,
  className = 'ting-auth-status',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <TingStatus variant="error" aria-live="assertive" className={className}>
    {children}
  </TingStatus>
);
