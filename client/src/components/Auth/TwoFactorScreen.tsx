import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ErrorTypes } from 'librechat-data-provider';
import { useForm, Controller } from 'react-hook-form';
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import {
  Label,
  Spinner,
  InputOTP,
  InputOTPSlot,
  InputOTPGroup,
  InputOTPSeparator,
} from '@librechat/client';
import { useVerifyTwoFactorTempMutation } from '~/data-provider';
import { TingButton, TingStatus } from '~/ting';
import { useLocalize } from '~/hooks';

interface VerifyPayload {
  tempToken: string;
  token?: string;
  backupCode?: string;
}

type TwoFactorFormInputs = {
  token?: string;
  backupCode?: string;
};

const TwoFactorScreen: React.FC = React.memo(() => {
  const [searchParams] = useSearchParams();
  const tempTokenRaw = searchParams.get('tempToken');
  const tempToken = tempTokenRaw !== null && tempTokenRaw !== '' ? tempTokenRaw : '';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoFactorFormInputs>();
  const localize = useLocalize();
  const [useBackup, setUseBackup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutate: verifyTempMutate } = useVerifyTwoFactorTempMutation({
    onSuccess: (result) => {
      if (result.token != null && result.token !== '') {
        window.location.href = '/';
      }
    },
    onMutate: () => {
      setErrorMessage(null);
      setIsLoading(true);
    },
    onError: (error: unknown) => {
      setIsLoading(false);
      const data = (error as { response?: { data?: { message?: unknown; code?: unknown } } })
        .response?.data;
      if (data?.code === ErrorTypes.AUTH_CROSS_ORIGIN) {
        setErrorMessage(localize('com_auth_error_login_cross_origin'));
        return;
      }
      setErrorMessage(localize('com_auth_error_login'));
    },
  });

  const onSubmit = useCallback(
    (data: TwoFactorFormInputs) => {
      const payload: VerifyPayload = { tempToken };
      if (useBackup && data.backupCode != null && data.backupCode !== '') {
        payload.backupCode = data.backupCode;
      } else if (data.token != null && data.token !== '') {
        payload.token = data.token;
      }
      verifyTempMutate(payload);
    },
    [tempToken, useBackup, verifyTempMutate],
  );

  const toggleBackupOn = useCallback(() => {
    setUseBackup(true);
  }, []);

  const toggleBackupOff = useCallback(() => {
    setUseBackup(false);
  }, []);

  return (
    <div>
      {errorMessage != null && (
        <TingStatus variant="error" className="ting-auth-status" aria-live="assertive">
          {errorMessage}
        </TingStatus>
      )}
      <form
        className="ting-auth-form"
        aria-label={localize('com_auth_verify_your_identity')}
        aria-busy={isLoading}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Label className="flex justify-center break-keep text-center text-sm text-text-primary">
          {localize('com_auth_two_factor')}
        </Label>
        {!useBackup && (
          <div className="flex flex-col items-center gap-2 text-text-primary">
            <Controller
              name="token"
              control={control}
              render={({ field: { onChange, value } }) => (
                <InputOTP
                  maxLength={6}
                  value={value != null ? value : ''}
                  onChange={onChange}
                  pattern={REGEXP_ONLY_DIGITS}
                >
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
                </InputOTP>
              )}
            />
            {errors.token && <TingStatus variant="error">{errors.token.message}</TingStatus>}
          </div>
        )}
        {useBackup && (
          <div className="flex flex-col items-center gap-2 text-text-primary">
            <Controller
              name="backupCode"
              control={control}
              render={({ field: { onChange, value } }) => (
                <InputOTP
                  maxLength={8}
                  value={value != null ? value : ''}
                  onChange={onChange}
                  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                >
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
                </InputOTP>
              )}
            />
            {errors.backupCode && (
              <TingStatus variant="error">{errors.backupCode.message}</TingStatus>
            )}
          </div>
        )}
        <div>
          <TingButton
            type="submit"
            aria-label={localize('com_auth_continue')}
            aria-busy={isLoading}
            data-testid="login-button"
            disabled={isLoading}
            size="form"
            className="w-full"
          >
            {isLoading ? <Spinner className="m-0" /> : localize('com_ui_verify')}
          </TingButton>
        </div>
        <div className="flex justify-center">
          {!useBackup ? (
            <TingButton type="button" variant="secondary" size="compact" onClick={toggleBackupOn}>
              {localize('com_ui_use_backup_code')}
            </TingButton>
          ) : (
            <TingButton type="button" variant="secondary" size="compact" onClick={toggleBackupOff}>
              {localize('com_ui_use_2fa_code')}
            </TingButton>
          )}
        </div>
      </form>
    </div>
  );
});

export default TwoFactorScreen;
