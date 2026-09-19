import { useEffect, useState } from 'react';
import { OpenIDIcon, useToastContext } from '@librechat/client';
import { ErrorTypes, registerPage } from 'librechat-data-provider';
import { useOutletContext, useSearchParams, useLocation } from 'react-router-dom';
import type { TLoginUser } from 'librechat-data-provider';
import type { TLoginLayoutContext } from '~/common';
import type { TranslationKeys } from '~/hooks';
import { getLoginError, persistRedirectToSession } from '~/utils';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import SocialButton from '~/components/Auth/SocialButton';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';
import { TingStatus } from '~/ting';
import LoginForm from './LoginForm';

interface LoginLocationState {
  registrationComplete?: boolean;
  redirect_to?: string;
}

const REGISTRATION_COMPLETE_SESSION_KEY = 'ting.registration-complete';

/** Error codes the server appends to the login redirect when an OAuth navigation is rejected. */
const oauthErrorKeys: Record<string, TranslationKeys> = {
  [ErrorTypes.AUTH_FAILED]: 'com_auth_error_oauth_failed',
  [ErrorTypes.AUTH_RATE_LIMITED]: 'com_auth_error_login_rl',
  [ErrorTypes.AUTH_BANNED]: 'com_auth_error_login_ban',
};

function Login() {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { error, setError, login } = useAuthContext();
  const { startupConfig } = useOutletContext<TLoginLayoutContext>();

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;
  const [registrationComplete, setRegistrationComplete] = useState(
    () =>
      locationState?.registrationComplete === true ||
      sessionStorage.getItem(REGISTRATION_COMPLETE_SESSION_KEY) === 'true',
  );
  const disableAutoRedirect = searchParams.get('redirect') === 'false';
  const sessionExpired = searchParams.get('reason') === 'session_expired';

  const [isAutoRedirectDisabled, setIsAutoRedirectDisabled] = useState(disableAutoRedirect);

  const handleLogin = (data: TLoginUser) => {
    setRegistrationComplete(false);
    sessionStorage.removeItem(REGISTRATION_COMPLETE_SESSION_KEY);
    return login(data);
  };

  useEffect(() => {
    const redirectTo = searchParams.get('redirect_to');
    if (redirectTo) {
      persistRedirectToSession(redirectTo);
    } else {
      if (locationState?.redirect_to) {
        persistRedirectToSession(locationState.redirect_to);
      }
    }

    const oauthError = searchParams?.get('error');
    /** `hasOwn` keeps an attacker-supplied `?error=toString` off the prototype chain. */
    const oauthErrorKey =
      oauthError != null && Object.hasOwn(oauthErrorKeys, oauthError)
        ? oauthErrorKeys[oauthError]
        : undefined;
    if (oauthErrorKey != null) {
      showToast({
        message: localize(oauthErrorKey),
        status: 'error',
      });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('error');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast, localize, locationState]);

  useEffect(() => {
    if (disableAutoRedirect) {
      setIsAutoRedirectDisabled(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('redirect');
      setSearchParams(newParams, { replace: true });
    }
  }, [disableAutoRedirect, searchParams, setSearchParams]);

  const shouldAutoRedirect =
    startupConfig?.openidLoginEnabled &&
    startupConfig?.openidAutoRedirect &&
    startupConfig?.serverDomain &&
    !isAutoRedirectDisabled;

  useEffect(() => {
    if (shouldAutoRedirect) {
      console.log('Auto-redirecting to OpenID provider...');
      window.location.href = `${startupConfig.serverDomain}/oauth/openid`;
    }
  }, [shouldAutoRedirect, startupConfig]);

  if (shouldAutoRedirect) {
    return (
      <div className="ting-auth-form">
        <TingStatus variant="neutral">
          {localize('com_ui_redirecting_to_provider', { 0: startupConfig.openidLabel })}
        </TingStatus>
        <div>
          <SocialButton
            key="openid"
            enabled={startupConfig.openidLoginEnabled}
            serverDomain={startupConfig.serverDomain}
            oauthPath="openid"
            Icon={() =>
              startupConfig.openidImageUrl ? (
                <img src={startupConfig.openidImageUrl} alt="OpenID Logo" className="h-5 w-5" />
              ) : (
                <OpenIDIcon />
              )
            }
            label={startupConfig.openidLabel}
            id="openid"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {registrationComplete && (
        <TingStatus variant="neutral" className="ting-auth-status" role="status" aria-live="polite">
          {localize('com_auth_ting_registration_complete')}
        </TingStatus>
      )}
      {sessionExpired && (
        <TingStatus
          variant="warning"
          title={localize('com_auth_ting_session_expired')}
          className="ting-auth-status"
          role="status"
          aria-live="polite"
        >
          {localize('com_auth_ting_sign_in_again')}
        </TingStatus>
      )}
      {error != null && <ErrorMessage>{localize(getLoginError(error))}</ErrorMessage>}
      {startupConfig?.emailLoginEnabled === true && (
        <LoginForm
          onSubmit={handleLogin}
          startupConfig={startupConfig}
          error={error}
          setError={setError}
        />
      )}
      {startupConfig?.registrationEnabled === true && (
        <p className="ting-auth-switch">
          {localize('com_auth_ting_no_account')}{' '}
          <a href={registerPage()} className="ting-auth-link ting-link">
            {localize('com_auth_ting_create_account')}
          </a>
        </p>
      )}
    </>
  );
}

export default Login;
