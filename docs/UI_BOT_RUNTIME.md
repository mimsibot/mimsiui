# UI <-> Bot Runtime Contract

Contrato operativo entre `mimsiui` y `mimsibot`.

## 1. Modelo correcto

`mimsibot` es el runtime.

`mimsiui` es el control plane autenticado.

Slack y la UI deben converger en el mismo backend de ejecución, no en dos lógicas paralelas.

## 2. Qué existe ya

### Lectura desde la UI

`mimsiui` ya puede leer desde la base real de `mimsibot`:

- overview
- tasks
- run de cada task
- steps
- events
- templates
- benchmark top
- servicios del host
- contexto básico: memoria, agentes y tareas recientes

Código relevante:

- `backend/app/api/protected.py`
- `backend/app/services/dashboard.py`
- `backend/app/services/context.py`

### Escritura desde la UI

`mimsiui` ya puede escribir en tablas puente que `mimsibot` consume:

- `ui_bridge_requests`
- `ui_chat_sessions`
- `ui_chat_messages`

Código relevante en `mimsiui`:

- `backend/app/services/bridge.py`
- `backend/app/services/chat.py`

Código relevante en `mimsibot`:

- `app/tasks/runner.py` en `_import_ui_requests`
- `app/tasks/runner.py` en `_import_ui_chat_messages`

## 3. Qué significa hoy “paralelismo UI <-> bot”

El paralelismo correcto no es ejecutar dos bots distintos.

Es esto:

- Slack puede seguir creando o observando tareas
- la UI puede crear o observar las mismas tareas
- ambos clientes leen el mismo `tasks.db`
- el runtime único que ejecuta sigue siendo `TaskRunner`

## 4. Asimetrías actuales

Estas son las brechas reales detectadas entre UI y Slack.

### A. El chat de la UI no tiene semántica de acción equivalente a Slack

Estado actual:

- los mensajes del chat UI se procesan con contexto y LLM
- pero no pasan por la misma experiencia de “haz X” que en Slack
- no convierten una intención de acción en una tarea persistida

Impacto:

- la UI conversa, pero no sustituye del todo al Slack operativo

Cambio recomendado en `mimsibot`:

- cuando `classify_message()` devuelva `action` en `_process_ui_chat_message`, crear `auto_task` con `trigger='ui-chat'`
- insertar en la sesión UI una respuesta inmediata con el `task_id`
- dejar que el chat UI muestre progreso de esa tarea, no solo una respuesta textual

### B. La UI ve runs, pero no controla todo lo que el runtime ya soporta

Estado actual:

- `mimsibot` ya soporta reanudar tarea, reanudar desde paso, reintentar paso y ejecutar plantillas
- la API de `mimsiui` todavía no expone esas acciones

Cambio recomendado en `mimsiui`:

- `POST /api/v1/tasks/{id}/resume`
- `POST /api/v1/tasks/{id}/resume-from-step`
- `POST /api/v1/tasks/{id}/retry-step`
- `GET /api/v1/tasks/{id}/artifacts`
- `POST /api/v1/templates/{id}/run`

Cambio recomendado en `mimsibot`:

- si se usa bridge por tabla, añadir tablas/filas de acción específicas o ampliar `ui_bridge_requests.payload_json`
- si se prefiere integración directa, exponer un pequeño worker RPC interno sin saltarse la persistencia

### C. No hay actualizaciones live

Estado actual:

- la UI depende de polling
- el runner procesa peticiones UI en el loop de background

Impacto:

- la experiencia móvil es correcta para estado, pero no aún para seguimiento fino

Cambio recomendado:

- añadir `SSE` o `WebSocket` en `mimsiui`
- publicar desde FastAPI cambios de:
  - `task_runs`
  - `task_steps`
  - `task_events`
  - `ui_chat_messages`

### D. Las notas/contexto diario del bot no están expuestas a la UI

Estado actual:

- `mimsibot` ya tiene vault Markdown diario y comandos Slack
- la UI solo expone memoria SQLite, no notas del vault

Cambio recomendado en `mimsibot`:

- añadir un pequeño adaptador de lectura para `data/notes/**/*.md`

Cambio recomendado en `mimsiui`:

- endpoints `GET /api/v1/notes/recent`
- `GET /api/v1/notes/{date}`
- `POST /api/v1/notes/{date}`
- búsqueda simple de notas por texto

### E. Slack y UI no comparten todavía una capa común de identidad de operador

Estado actual:

- Slack usa usuario/canal Slack
- UI usa `sub`, `name`, `email` de OIDC

Impacto:

- el histórico existe, pero la atribución cruzada todavía es heterogénea

Cambio recomendado en `mimsibot`:

- normalizar `triggered_by` y `created_by` con prefijos de origen:
  - `slack:<user>`
  - `ui:<sub>`
  - `system:<name>`

## 5. Cambios prioritarios en `mimsibot`

Orden recomendado para una transición limpia desde Slack a UI.

### Prioridad 1

- soportar acciones desde chat UI con creación real de tareas
- normalizar identidad por origen en tasks/memory/hooks
- exponer artifacts y acciones de retry/resume a la API

### Prioridad 2

- exponer notas diarias y contexto histórico Markdown
- enriquecer `task_events` con mensajes más orientados a UI móvil
- separar mejor `task.completed` de “respuesta larga para Slack”

### Prioridad 3

- streaming live para tasks y chat
- cola explícita de notificaciones UI
- vistas de night audit y salud de providers en la UI

## 6. Cambios prioritarios en `mimsiui`

- crear un índice único de documentación
- tratar Slack como canal secundario en copy y runbooks
- añadir pantallas o acciones para:
  - resume
  - retry step
  - artifacts
  - notes
  - night audit
- añadir polling/streaming unificado por sesión y por task

## 7. Regla de diseño para no romper el sistema

Si una funcionalidad ya existe en `mimsibot`, la UI debe integrarla.

No debe reimplementarla.

## 8. Resultado buscado

Estado final deseado:

- el usuario opera desde la UI
- Slack recibe resúmenes, alertas y fallback
- `mimsibot` sigue siendo el único runtime de ejecución
- SQLite sigue siendo la fuente compartida de verdad
- la experiencia móvil tiene paridad funcional con Slack para operación diaria
