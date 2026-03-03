from fastapi import APIRouter, HTTPException, Query, Security

from app.core.settings import settings
from app.security.oidc import get_current_claims
from app.services.dashboard import DashboardService

svc = DashboardService()
router = APIRouter()
read_access = Security(get_current_claims, scopes=[settings.auth_required_scope])


@router.get("/auth/me")
def auth_me(claims: dict = read_access):
    return {"subject": claims.get("sub"), "claims": claims}


@router.get("/overview")
def overview(claims: dict = read_access):
    return svc.overview()


@router.get("/tasks")
def tasks(
    limit: int = Query(default=20, ge=1, le=200),
    status: str = "",
    claims: dict = read_access,
):
    return {"items": svc.list_tasks(limit=limit, status=status or None)}


@router.get("/tasks/{task_id}")
def task_detail(task_id: int, claims: dict = read_access):
    item = svc.get_task(task_id)
    if not item:
        raise HTTPException(status_code=404, detail="task not found")
    return item


@router.get("/tasks/{task_id}/run")
def task_run(task_id: int, claims: dict = read_access):
    item = svc.get_task_run(task_id)
    if not item:
        raise HTTPException(status_code=404, detail="run not found")
    return item


@router.get("/tasks/{task_id}/steps")
def task_steps(task_id: int, claims: dict = read_access):
    return {"items": svc.get_task_steps(task_id)}


@router.get("/tasks/{task_id}/events")
def task_events(
    task_id: int,
    limit: int = Query(default=50, ge=1, le=500),
    claims: dict = read_access,
):
    return {"items": svc.get_task_events(task_id, limit=limit)}


@router.get("/templates")
def templates(limit: int = Query(default=50, ge=1, le=200), claims: dict = read_access):
    return {"items": svc.list_templates(limit=limit)}


@router.get("/agents")
def agents(limit: int = Query(default=50, ge=1, le=200), claims: dict = read_access):
    return {"items": svc.list_agents(limit=limit)}


@router.get("/hooks")
def hooks(
    event_name: str = "",
    limit: int = Query(default=50, ge=1, le=200),
    claims: dict = read_access,
):
    return {"items": svc.list_hooks(limit=limit, event_name=event_name or None)}


@router.get("/benchmark/top/{subject_type}")
def benchmark_top(
    subject_type: str,
    metric_name: str = "success",
    limit: int = Query(default=10, ge=1, le=100),
    claims: dict = read_access,
):
    return {"items": svc.benchmark_top(subject_type=subject_type, metric_name=metric_name, limit=limit)}


@router.get("/services")
def services(claims: dict = read_access):
    return {"items": svc.services()}


@router.get("/config")
def config(prefix: str = "", claims: dict = read_access):
    return {"items": svc.config(prefix=prefix or None)}
