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

## Recomendación operativa

Para producción, usa un proveedor OIDC maduro con MFA y gestión de sesiones:

- Keycloak
- Auth0
- Okta
- Microsoft Entra ID

## Seguridad mínima esperada

- HTTPS obligatorio en el gateway
- tokens cortos
- MFA en el IdP
- scopes separados para lectura y escritura
- `mimsibot` sin exposición directa a internet
- logs de acceso y auditoría en FastAPI / reverse proxy
