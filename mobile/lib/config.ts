import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

const envOrExtra = (envValue: string | undefined, extraKey: string) => {
  const extraValue = extra[extraKey];
  return envValue || (typeof extraValue === 'string' ? extraValue : '');
};

const rawApiBaseUrl = envOrExtra(process.env.EXPO_PUBLIC_API_BASE_URL, 'apiBaseUrl');
const rawIssuer = envOrExtra(process.env.EXPO_PUBLIC_OIDC_ISSUER, 'oidcIssuer');
const rawClientId = envOrExtra(process.env.EXPO_PUBLIC_OIDC_CLIENT_ID, 'oidcClientId');
const rawAudience = envOrExtra(process.env.EXPO_PUBLIC_OIDC_AUDIENCE, 'oidcAudience');
const rawScope = envOrExtra(process.env.EXPO_PUBLIC_OIDC_SCOPE, 'oidcScope');
const rawWriteScope = envOrExtra(process.env.EXPO_PUBLIC_OIDC_WRITE_SCOPE, 'oidcWriteScope');

export const appConfig = {
  apiBaseUrl: rawApiBaseUrl || 'http://127.0.0.1:8000',
  oidcAudience: rawAudience || '',
  oidcClientId: rawClientId || '',
  oidcIssuer: rawIssuer || '',
  requiredScope: rawScope || 'mimsiui.read',
  writeScope: rawWriteScope || 'mimsiui.write',
};

export const authScopes = Array.from(
  new Set(['openid', 'profile', 'email', appConfig.requiredScope, appConfig.writeScope].filter(Boolean)),
);
