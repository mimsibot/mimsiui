# Plan

## Dirección

`mimsiui` no es otro bot. Es el plano de control visual y seguro para `mimsibot`.

Objetivo operativo:

- sacar la conversación operativa de Slack
- mantener a `mimsibot` no expuesto directamente
- usar una app Android-first como interfaz primaria
- dejar a FastAPI como gateway autenticado, auditable y versionable

## Fase actual

Ya implementado:

1. backend `FastAPI` read-only conectado al estado real de `mimsibot`
2. OAuth 2.0 / OIDC con JWT verification y scopes
3. app Expo / React Native con overview, tasks, services y account
4. tests frontend + export web
5. base de despliegue incremental para backend y OTA móvil

## Siguientes fases

1. añadir endpoints write-protected para acciones del bot
2. añadir timeline de tareas, pasos y artefactos
3. incorporar `SSE` o `WebSocket` para progreso live
4. crear pantalla de conversación con el bot
5. usar `mimsiui` como cliente principal y relegar Slack a canal secundario
