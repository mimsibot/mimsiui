# OAuth 2.0 y OIDC

## Modelo

`mimsiui` usa autenticación fuerte basada en:

- OAuth 2.0 Authorization Code Flow
- PKCE para el cliente móvil/public client
- OpenID Connect para identidad
- validación local de JWT en FastAPI mediante `issuer` + `jwks_uri`

Esto evita exponer directamente `mimsibot` al exterior. La app nunca habla con el bot sin pasar por FastAPI.

## Flujo

1. la app Expo abre el login contra el proveedor OIDC
2. el usuario completa MFA / login en el proveedor
3. Expo intercambia el `authorization code` por tokens usando PKCE
4. la app llama a FastAPI con `Bearer access_token`
5. FastAPI valida firma, `iss`, `aud` y scopes usando JWKS
6. solo entonces FastAPI entrega lectura o, en fases futuras, comandos al bot

## Scopes

Scopes recomendados:

- `openid`
- `profile`
- `email`
- `mimsiui.read`
- `mimsiui.write`

En esta fase, todas las rutas protegidas usan `mimsiui.read`.

## Variables backend

- `AUTH_ENABLED=true`
- `AUTH_ISSUER=https://your-idp.example.com/realms/mimsi`
- `AUTH_AUDIENCE=mimsiui-api`
- `AUTH_CLIENT_ID=mimsiui-mobile`
- `AUTH_REQUIRED_SCOPE=mimsiui.read`
- `AUTH_ADMIN_SCOPE=mimsiui.write`
- `CORS_ORIGINS_RAW=https://mimsiui.example.com,exp://192.168.18.56:8081`

## Variables mobile

- `EXPO_PUBLIC_API_BASE_URL=https://mimsiui.example.com`
- `EXPO_PUBLIC_OIDC_ISSUER=https://your-idp.example.com/realms/mimsi`
- `EXPO_PUBLIC_OIDC_CLIENT_ID=mimsiui-mobile`
- `EXPO_PUBLIC_OIDC_AUDIENCE=mimsiui-api`
- `EXPO_PUBLIC_OIDC_SCOPE=mimsiui.read`

## Proveedor inicial recomendado

Para este proyecto, la opción inicial más pragmática es **Auth0**:

- típico y ampliamente soportado
- plan gratuito vigente
- OIDC estándar
- encaja bien con app móvil + API propia
- muy rápido de configurar para un primer despliegue fuera de SSH/Slack

## Setup recomendado con Auth0

1. crea una **Native Application** llamada `mimsiui-mobile`
2. crea una **API** llamada `mimsiui-api`
3. usa como `Identifier` de la API algo como `https://mimsiui-api`
4. define scopes:
   - `mimsiui.read`
   - `mimsiui.write`
5. en la app nativa, permite callbacks tipo:
   - `mimsiui://auth/callback`
6. activa MFA en el tenant

Valores a poner luego en producción:

- `AUTH_ISSUER=https://YOUR_TENANT_REGION.auth0.com/`
- `AUTH_AUDIENCE=https://mimsiui-api`
- `AUTH_CLIENT_ID=<client-id-native-app>`
- `AUTH_REQUIRED_SCOPE=mimsiui.read`
- `AUTH_ADMIN_SCOPE=mimsiui.write`
- `EXPO_PUBLIC_OIDC_ISSUER=https://YOUR_TENANT_REGION.auth0.com/`
- `EXPO_PUBLIC_OIDC_AUDIENCE=https://mimsiui-api`
- `EXPO_PUBLIC_OIDC_CLIENT_ID=<client-id-native-app>`
- `EXPO_PUBLIC_OIDC_SCOPE=mimsiui.read`
- `EXPO_PUBLIC_OIDC_WRITE_SCOPE=mimsiui.write`

## Seguridad mínima esperada

- HTTPS obligatorio en el gateway
- tokens cortos
- MFA en el IdP
- `email_verified=true` obligatorio para operaciones write
- scopes separados para lectura y escritura
- `TrustedHostMiddleware` y cabeceras de endurecimiento en FastAPI
- `mimsibot` sin exposición directa a internet
- logs de acceso y auditoría en FastAPI / reverse proxy
