import { useCallback, useEffect, useState } from 'react';
import { useGetStartupConfig } from '~/data-provider';

/**
 * Keeps every UI action that can start a model response on the same capability
 * contract. The backend remains authoritative; this guard prevents an optimistic
 * message mutation when startup configuration already says that no model is
 * available and exposes one local status slot to the owning surface.
 */
export default function useTingChatCapabilityGuard(scopeKey?: string) {
  const { data: startupConfig } = useGetStartupConfig();
  const capabilityStatus = startupConfig?.chatCapability?.status;
  const [showCapabilityError, setShowCapabilityError] = useState(false);

  useEffect(() => {
    setShowCapabilityError(false);
  }, [capabilityStatus, scopeKey]);

  const requireChatCapability = useCallback(() => {
    if (capabilityStatus === 'not_configured') {
      setShowCapabilityError(true);
      return false;
    }
    setShowCapabilityError(false);
    return true;
  }, [capabilityStatus]);

  return {
    capabilityStatus,
    requireChatCapability,
    showCapabilityError,
  };
}
