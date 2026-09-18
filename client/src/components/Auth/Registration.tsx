import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Spinner } from '@librechat/client';
import { loginPage } from 'librechat-data-provider';
import { Turnstile } from '@marsidev/react-turnstile';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useRegisterUserMutation } from 'librechat-data-provider/react-query';
import type { TRegisterUser } from 'librechat-data-provider';
import type { TLoginLayoutContext } from '~/common';
import { TingButton, TingField } from '~/ting';
import { ErrorMessage } from './ErrorMessage';
import { useLocalize } from '~/hooks';

const REGISTRATION_COMPLETE_SESSION_KEY = 'ting.registration-complete';

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const localize = useLocalize();
  const { startupConfig, startupConfigError, isFetching } = useOutletContext<TLoginLayoutContext>();
  const {
    watch,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TRegisterUser>({ mode: 'onChange' });
  const password = watch('password');
  const [hasRequestError, setHasRequestError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');
  const requireCaptcha = Boolean(startupConfig?.turnstile?.siteKey);
  const showSecretLabel = `${localize('com_ui_show')} ${localize('com_auth_password')}`;
  const hideSecretLabel = `${localize('com_ui_hide')} ${localize('com_auth_password')}`;

  const registerUser = useRegisterUserMutation({
    onMutate: () => {
      setHasRequestError(false);
      setIsSubmitting(true);
    },
    onSuccess: () => {
      setIsSubmitting(false);
      sessionStorage.setItem(REGISTRATION_COMPLETE_SESSION_KEY, 'true');
      navigate('/login', { replace: true, state: { registrationComplete: true } });
    },
    onError: () => {
      setIsSubmitting(false);
      setHasRequestError(true);
    },
  });
  const pending = isSubmitting || registerUser.isLoading;

  const submitRegistration = (data: TRegisterUser) => {
    registerUser.mutate({ ...data, token: token ?? undefined });
  };

  if (startupConfigError || isFetching) {
    return null;
  }

  return (
    <>
      {(hasRequestError || registerUser.isError) && (
        <ErrorMessage>{localize('com_auth_error_create')}</ErrorMessage>
      )}
      <form
        className="ting-auth-form"
        aria-label={localize('com_auth_ting_create_account')}
        aria-busy={pending}
        method="POST"
        noValidate
        onSubmit={handleSubmit(submitRegistration)}
      >
        <TingField
          id="name"
          type="text"
          autoComplete="name"
          label={localize('com_auth_full_name')}
          error={errors.name?.message}
          data-testid="name"
          {...register('name', {
            required: localize('com_auth_name_required'),
            minLength: {
              value: 3,
              message: localize('com_auth_name_min_length'),
            },
            maxLength: {
              value: 80,
              message: localize('com_auth_name_max_length'),
            },
          })}
        />
        <TingField
          id="username"
          type="text"
          autoComplete="username"
          label={localize('com_auth_username')}
          error={errors.username?.message}
          data-testid="username"
          {...register('username', {
            minLength: {
              value: 2,
              message: localize('com_auth_username_min_length'),
            },
            maxLength: {
              value: 80,
              message: localize('com_auth_username_max_length'),
            },
          })}
        />
        <TingField
          id="email"
          type="email"
          autoComplete="email"
          label={localize('com_auth_email_address')}
          error={errors.email?.message}
          data-testid="email"
          {...register('email', {
            required: localize('com_auth_email_required'),
            minLength: {
              value: 1,
              message: localize('com_auth_email_min_length'),
            },
            maxLength: {
              value: 120,
              message: localize('com_auth_email_max_length'),
            },
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: localize('com_auth_email_pattern'),
            },
          })}
        />
        <TingField
          id="password"
          type="password"
          autoComplete="new-password"
          label={localize('com_auth_password')}
          error={errors.password?.message}
          showSecretLabel={showSecretLabel}
          hideSecretLabel={hideSecretLabel}
          data-testid="password"
          {...register('password', {
            required: localize('com_auth_password_required'),
            minLength: {
              value: startupConfig?.minPasswordLength || 8,
              message: localize('com_auth_password_min_length'),
            },
            maxLength: {
              value: 128,
              message: localize('com_auth_password_max_length'),
            },
          })}
        />
        <TingField
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          label={localize('com_auth_password_confirm')}
          error={errors.confirm_password?.message}
          showSecretLabel={`${localize('com_ui_show')} ${localize('com_auth_password_confirm')}`}
          hideSecretLabel={`${localize('com_ui_hide')} ${localize('com_auth_password_confirm')}`}
          data-testid="confirm_password"
          {...register('confirm_password', {
            validate: (value: string | undefined) =>
              value === password || localize('com_auth_password_not_match'),
          })}
        />
        {requireCaptcha && (
          <div className="flex justify-center">
            <Turnstile
              siteKey={startupConfig!.turnstile!.siteKey}
              options={{
                ...startupConfig!.turnstile!.options,
                theme: 'light',
              }}
              onSuccess={setTurnstileToken}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
            />
          </div>
        )}
        <TingButton
          disabled={
            Object.keys(errors).length > 0 || pending || (requireCaptcha && !turnstileToken)
          }
          type="submit"
          aria-label={localize('com_auth_ting_create_account')}
          aria-busy={pending}
          size="form"
          className="w-full"
        >
          {pending ? (
            <Spinner className="m-0" />
          ) : (
            <>
              {localize('com_auth_ting_create_account')}
              <ArrowRight aria-hidden="true" />
            </>
          )}
        </TingButton>
      </form>
      <p className="ting-auth-switch">
        {localize('com_auth_ting_already_have_account')}{' '}
        <a
          href={loginPage()}
          aria-label={localize('com_auth_login')}
          className="ting-auth-link ting-link"
        >
          {localize('com_auth_login')}
        </a>
      </p>
    </>
  );
};

export default Registration;
