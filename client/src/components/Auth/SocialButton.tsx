import React from 'react';
import type { ComponentType } from 'react';
import { TingButton } from '~/ting';

interface SocialButtonProps {
  Icon: ComponentType<{ className?: string }>;
  enabled?: boolean;
  id: string;
  label: string;
  oauthPath: string;
  serverDomain?: string;
}

const SocialButton = ({ Icon, enabled, id, label, oauthPath, serverDomain }: SocialButtonProps) => {
  if (!enabled || !serverDomain) {
    return null;
  }

  return (
    <TingButton asChild variant="secondary" size="form" className="w-full justify-start">
      <a aria-label={label} href={`${serverDomain}/oauth/${oauthPath}`} data-testid={id}>
        <Icon className="size-5" />
        <span>{label}</span>
      </a>
    </TingButton>
  );
};

export default SocialButton;
