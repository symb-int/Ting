import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
  Spinner,
} from '@librechat/client';
import { useLocalize } from '~/hooks';
import { TingButton } from '~/ting';

const fadeAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

interface DisablePhaseProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onDisable: (token: string, useBackup: boolean) => void;
  isDisabling: boolean;
}

export const DisablePhase: React.FC<DisablePhaseProps> = ({ onDisable, isDisabling }) => {
  const localize = useLocalize();
  const [token, setToken] = useState('');
  const [useBackup, setUseBackup] = useState(false);

  return (
    <motion.div {...fadeAnimation} className="space-y-8">
      <div className="flex justify-center">
        <InputOTP
          value={token}
          onChange={setToken}
          maxLength={useBackup ? 8 : 6}
          pattern={useBackup ? REGEXP_ONLY_DIGITS_AND_CHARS : REGEXP_ONLY_DIGITS}
          className="gap-2"
        >
          {useBackup ? (
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
              <InputOTPSlot index={6} />
              <InputOTPSlot index={7} />
            </InputOTPGroup>
          ) : (
            <>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </>
          )}
        </InputOTP>
      </div>
      <TingButton
        variant="danger"
        size="compact"
        onClick={() => onDisable(token, useBackup)}
        disabled={isDisabling || token.length !== (useBackup ? 8 : 6)}
        className="w-full"
      >
        {isDisabling && <Spinner className="mr-2" />}
        {isDisabling ? localize('com_ui_disabling') : localize('com_ui_2fa_disable')}
      </TingButton>
      <TingButton
        type="button"
        variant="secondary"
        size="compact"
        onClick={() => setUseBackup(!useBackup)}
      >
        {useBackup ? localize('com_ui_use_2fa_code') : localize('com_ui_use_backup_code')}
      </TingButton>
    </motion.div>
  );
};
