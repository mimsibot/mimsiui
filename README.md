# mimsiui

UI y API de observabilidad/control para `mimsibot`.

Primera fase incluida en este repo:

- backend `FastAPI` read-only
- lectura del estado real de `mimsibot`
- endpoints para overview, tareas, plantillas, agentes, hooks, benchmark y servicios

## Estructura

- `backend/`: API FastAPI
- `docs/`: arquitectura y plan

## Arranque local

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Variables

Por defecto lee `mimsibot` desde:

- DB: `/opt/mimsibot/data/tasks.db`
- repo: `/opt/mimsibot`

Puedes sobrescribir con:

- `MIMSIBOT_DB_PATH`
- `MIMSIBOT_ROOT`

