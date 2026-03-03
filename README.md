# mimsiui

UI y API para hablar con `mimsibot` fuera de Slack y fuera de SSH.

Arquitectura objetivo:

- `React Native / Expo` como cliente Android-first
- `FastAPI` como gateway seguro y capa de observabilidad
- `mimsibot` como runtime privado detrás de la API

El flujo que se está consolidando en este repo es:

`React Native -> FastAPI -> mimsibot`

## Estado actual

- backend `FastAPI` read-only conectado al `tasks.db` real de `mimsibot`
- OAuth 2.0 / OIDC preparado en backend con JWT validation por JWKS
- frontend Expo Router con pantallas base: `overview`, `tasks`, `services`, `account`
- tests de frontend y export web ejecutables localmente
- scripts de despliegue incremental y OTA móvil preparados

## Estructura

- `backend/`: API FastAPI
- `mobile/`: app Expo / React Native
- `docs/`: plan, auth y despliegue
- `scripts/`: despliegue y smoke tests
- `deploy/`: ejemplos de `systemd` y reverse proxy

## Backend local

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Mobile local

```bash
cd mobile
npm install
npm test
npm run export:web
npm run android
```

## Variables backend

- `MIMSIBOT_DB_PATH`
- `MIMSIBOT_ROOT`
- `AUTH_ENABLED`
- `AUTH_ISSUER`
- `AUTH_AUDIENCE`
- `AUTH_CLIENT_ID`
- `AUTH_REQUIRED_SCOPE`
- `AUTH_ADMIN_SCOPE`
- `CORS_ORIGINS_RAW`

## Variables mobile

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_OIDC_ISSUER`
- `EXPO_PUBLIC_OIDC_CLIENT_ID`
- `EXPO_PUBLIC_OIDC_AUDIENCE`
- `EXPO_PUBLIC_OIDC_SCOPE`

## Documentación

- `docs/OAUTH2.md`
- `docs/DEPLOYMENT.md`
- `docs/PLAN.md`
