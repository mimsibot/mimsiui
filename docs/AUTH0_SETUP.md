# Auth0 Setup

Configuración mínima para sacar `mimsiui` fuera de SSH y Slack con autenticación fuerte.

## 1. Crear tenant

Crea un tenant Auth0 y usa el plan gratuito.

## 2. Crear API

En `Applications -> APIs`:

- Name: `mimsiui-api`
- Identifier: `https://mimsiui-api`
- Signing Algorithm: `RS256`

Scopes:

- `mimsiui.read`
- `mimsiui.write`

## 3. Crear Native Application

En `Applications` crea `mimsiui-mobile` de tipo `Native`.

Configura:

- Token Endpoint Authentication Method: `None`
- Allowed Callback URLs: `mimsiui://auth/callback`
- Allowed Logout URLs: `mimsiui://auth/callback`

## 4. Variables backend

```env
AUTH_ENABLED=true
AUTH_ISSUER=https://YOUR_TENANT_REGION.auth0.com/
AUTH_AUDIENCE=https://mimsiui-api
AUTH_CLIENT_ID=YOUR_NATIVE_CLIENT_ID
AUTH_REQUIRED_SCOPE=mimsiui.read
AUTH_ADMIN_SCOPE=mimsiui.write
CORS_ORIGINS_RAW=https://mimsiui.example.com,exp://192.168.18.56:8081
```

## 5. Variables mobile

```env
EXPO_PUBLIC_API_BASE_URL=https://mimsiui.example.com
EXPO_PUBLIC_OIDC_ISSUER=https://YOUR_TENANT_REGION.auth0.com/
EXPO_PUBLIC_OIDC_CLIENT_ID=YOUR_NATIVE_CLIENT_ID
EXPO_PUBLIC_OIDC_AUDIENCE=https://mimsiui-api
EXPO_PUBLIC_OIDC_SCOPE=mimsiui.read
EXPO_PUBLIC_OIDC_WRITE_SCOPE=mimsiui.write
```

## 6. MFA

Activa MFA en Auth0 antes de abrir la app fuera de la red privada.

## 7. Observación para Expo

Este repo usa `expo-auth-session`. Para distribución Android real, el camino operativo correcto es un Dev Client / EAS build, no depender de Expo Go.
