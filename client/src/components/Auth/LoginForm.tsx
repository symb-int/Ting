import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Spinner } from '@librechat/client';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TLoginUser, TStartupConfig } from 'librechat-data-provider';
import type { TAuthContext } from '~/common';
import { useResendVerificationEmail } from '~/data-provider';
import { TingButton, TingField, TingStatus } from '~/ting';
import { validateEmail } from '~/utils';
import { useLocalize } from '~/hooks';

type TLoginFormProps = {
  onSubmit: (data: TLoginUser) => void;
  startupConfig: TStartupConfig;
  error: Pick<TAuthContext, 'error'>['error'];
  setError: Pick<TAuthContext, 'setError'>['setError'];
};

const LoginForm: React.FC<TLoginFormProps> = ({ onSubmit, startupConfig, error, setError }) => {
  const localize = useLocalize();
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TLoginUser>();
  const [showResendLink, setShowResendLink] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [requestPending, setRequestPending] = useState(false);
  const requireCaptcha = Boolean(startupConfig.turnstile?.siteKey);
  const pending = requestPending || isSubmitting;
  const showSecretLabel = `${localize('com_ui_show')} ${localize('com_auth_password')}`;
  const hideSecretLabel = `${localize('com_ui_hide')} ${localize('com_auth_password')}`;

  useEffect(() => {
    if (error == null) {
      return;
    }
    setRequestPending(false);
    if (error.includes('422')) {
      setShowResendLink(true);
    }
  }, [error]);

  const resendLinkMutation = useResendVerificationEmail({
    onMutate: () => {
      setError(undefined);
      setShowResendLink(false);
    },
  });

  const handleResendEmail = () => {
    const email = getValues('email');
    if (!email) {
      setShowResendLink(false);
      return;
    }
    resendLinkMutation.mutate({ email });
  };

  const submitLogin = (data: TLoginUser) => {
    setError(undefined);
    setRequestPending(true);
    onSubmit(data);
  };

  return (
    <>
      {showResendLink && (
        <TingStatus variant="neutral" className="ting-auth-status">
          {localize('com_auth_email_verification_resend_prompt')}{' '}
          <button
            type="button"
            className="ting-link font-bold"
            onClick={handleResendEmail}
            disabled={resendLinkMutation.isLoading}
          >
            {localize('com_auth_email_resend_link')}
          </button>
        </TingStatus>
      )}
      <form
        className="ting-auth-form"
        aria-label={localize('com_auth_login')}
        aria-busy={pending}
        method="POST"
        noValidate
        onSubmit={handleSubmit(submitLogin)}
      >
        <TingField
          id="email"
          type="email"
          autoComplete="email"
          label={localize('com_auth_email_address')}
          error={errors.email?.message}
          {...register('email', {
            required: localize('com_auth_email_required'),
            maxLength: { value: 120, message: localize('com_auth_email_max_length') },
            validate: (value) => validateEmail(value, localize('com_auth_email_pattern')),
          })}
        />
        <TingField
          id="password"
          type="password"
          autoComplete="current-password"
          label={localize('com_auth_password')}
          error={errors.password?.message}
          showSecretLabel={showSecretLabel}
          hideSecretLabel={hideSecretLabel}
          {...register('password', {
            required: localize('com_auth_password_required'),
            minLength: {
              value: startupConfig.minPasswordLength || 8,
              message: localize('com_auth_password_min_length'),
            },
            maxLength: { value: 128, message: localize('com_auth_password_max_length') },
          })}
        />
        {startupConfig.passwordResetEnabled && (
          <a
            href="/forgot-password"
            className="ting-auth-link ting-link justify-self-start text-sm"
          >
            {localize('com_auth_password_forgot')}
          </a>
        )}
        {requireCaptcha && (
          <div className="flex justify-center">
            <Turnstile
              siteKey={startupConfig.turnstile!.siteKey}
              options={{
                ...startupConfig.turnstile!.options,
                theme: 'light',
              }}
              onSuccess={setTurnstileToken}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
            />
          </div>
        )}
        <TingButton
          aria-label={localize('com_auth_login')}
          aria-busy={pending}
          data-testid="login-button"
          type="submit"
          size="form"
          className="w-full"
          disabled={(requireCaptcha && !turnstileToken) || pending}
        >
          {pending ? (
            <Spinner className="m-0" />
          ) : (
            <>
              {localize('com_auth_login')}
              <ArrowRight aria-hidden="true" />
            </>
          )}
        </TingButton>
      </form>
    </>
  );
};

export default LoginForm;
