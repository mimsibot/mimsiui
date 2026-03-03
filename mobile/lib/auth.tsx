import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { appConfig, authScopes } from '@/lib/config';
import { clearSession, loadSession, persistSession } from '@/lib/storage';

WebBrowser.maybeCompleteAuthSession();

type Session = {
  accessToken: string;
  idToken: string | null;
  scope: string;
};

type AuthContextValue = {
  authError: string;
  authReady: boolean;
  config: typeof appConfig;
  isAuthenticating: boolean;
  isHydrating: boolean;
  session: Session | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  const redirectUri = AuthSession.makeRedirectUri({
    native: `${Constants.expoConfig?.scheme ?? 'mimsiui'}://auth/callback`,
    path: 'auth/callback',
  });
  const discovery = AuthSession.useAutoDiscovery(appConfig.oidcIssuer || 'https://invalid.local');
  const authReady = Boolean(appConfig.oidcIssuer && appConfig.oidcClientId && discovery);
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: appConfig.oidcClientId || 'mimsiui-mobile',
      redirectUri,
      scopes: authScopes,
      usePKCE: true,
      extraParams: appConfig.oidcAudience ? { audience: appConfig.oidcAudience } : undefined,
    },
    discovery,
  );

  useEffect(() => {
    loadSession()
      .then((stored) => {
        if (stored) {
          setSession(stored);
        }
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, []);

  useEffect(() => {
    if (response?.type !== 'success' || !discovery) {
      return;
    }
    let cancelled = false;
    setIsAuthenticating(true);
    setAuthError('');
    AuthSession.exchangeCodeAsync(
      {
        clientId: appConfig.oidcClientId,
        code: response.params.code,
        redirectUri,
        scopes: authScopes,
        extraParams: {
          code_verifier: request?.codeVerifier || '',
          ...(appConfig.oidcAudience ? { audience: appConfig.oidcAudience } : {}),
        },
      },
      discovery,
    )
      .then(async (tokenResponse) => {
        const nextSession: Session = {
          accessToken: tokenResponse.accessToken,
          idToken: tokenResponse.idToken ?? null,
          scope: tokenResponse.scope ?? authScopes.join(' '),
        };
        if (!cancelled) {
          setSession(nextSession);
        }
        await persistSession(nextSession);
      })
      .catch((error) => {
        if (!cancelled) {
          setAuthError(error instanceof Error ? error.message : 'Authentication failed');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsAuthenticating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [discovery, redirectUri, request?.codeVerifier, response]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authError,
      authReady,
      config: appConfig,
      isAuthenticating,
      isHydrating,
      session,
      signIn: async () => {
        setAuthError('');
        if (!authReady || !request) {
          setAuthError('OIDC is not configured yet in this build.');
          return;
        }
        const result = await promptAsync();
        if (result.type === 'dismiss' || result.type === 'cancel') {
          setAuthError('Sign-in flow was cancelled.');
        }
      },
      signOut: async () => {
        setSession(null);
        await clearSession();
      },
    }),
    [authError, authReady, isAuthenticating, isHydrating, promptAsync, request, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
