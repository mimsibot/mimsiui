# Docs Hub

Documento canónico para entender `mimsiui`, su relación con `mimsibot` y el estado real del despliegue.

## Qué es `mimsiui`

`mimsiui` no es otro bot. Es la interfaz autenticada y mobile-first del runtime que ya vive en `mimsibot`.

Flujo objetivo:

`UI móvil/web -> FastAPI -> SQLite/host -> mimsibot runtime`

Objetivo operativo:

- usar la UI como cliente principal
- dejar Slack como cliente secundario y canal de notificaciones
- mantener SSH para mantenimiento profundo, no para operación diaria

## Qué leer según la necesidad

- arquitectura y contrato UI↔bot: `docs/UI_BOT_RUNTIME.md`
- despliegue backend y móvil: `docs/DEPLOYMENT.md`
- runbook de salida a móvil: `docs/LAUNCH_RUNBOOK.md`
- auth/OIDC: `docs/OAUTH2.md`
- setup detallado de Auth0: `docs/AUTH0_SETUP.md`
- dirección de producto y fases: `docs/PLAN.md`

## Estado actual resumido

Ya implementado:

- backend `FastAPI` conectado al `tasks.db` real de `mimsibot`
- auth OIDC/JWT con scopes `mimsiui.read` y `mimsiui.write`
- pantallas Expo para overview, tasks, services, account, chat y context
- bridge de tareas UI -> SQLite -> `TaskRunner` de `mimsibot`
- chat persistente UI -> SQLite -> router/contexto de `mimsibot`
- despliegue SSH al MSI con `systemd` y Tailscale
- host remoto del MSI listo para builds Android con `pnpm`
- proyecto EAS inicializado para `@mimsibot/mimsiui`

## Principio de integración

La lógica de ejecución vive en `mimsibot`.

`mimsiui` debe:

- leer estado
- presentar contexto
- solicitar acciones controladas
- mostrar progreso y resultado

`mimsiui` no debe:

- duplicar el runtime de tareas
- abrir shell arbitrario al móvil
- introducir una segunda fuente de verdad para tareas, memoria o hooks

## Fuente de verdad

- tareas y runs: `mimsibot/app/tasks/runner.py`
- persistencia: `mimsibot/data/tasks.db`
- identidad y contexto del bot: `mimsibot/app/agents/context.py`
- notas y memoria diaria: `mimsibot/app/notes/store.py`
- observabilidad nocturna: `mimsibot/app/benchmark/night_audit.py`

## Siguiente lectura recomendada

Si quieres trabajar UI y bot en paralelo, empieza por `docs/UI_BOT_RUNTIME.md`.
