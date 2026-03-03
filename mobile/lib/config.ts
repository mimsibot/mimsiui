const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const rawIssuer = process.env.EXPO_PUBLIC_OIDC_ISSUER;
const rawClientId = process.env.EXPO_PUBLIC_OIDC_CLIENT_ID;
const rawAudience = process.env.EXPO_PUBLIC_OIDC_AUDIENCE;
const rawScope = process.env.EXPO_PUBLIC_OIDC_SCOPE;
const rawWriteScope = process.env.EXPO_PUBLIC_OIDC_WRITE_SCOPE;

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
