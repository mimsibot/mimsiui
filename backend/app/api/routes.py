from fastapi import APIRouter, HTTPException, Query

from app.services.dashboard import DashboardService

router = APIRouter()
svc = DashboardService()


@router.get("/overview")
def overview():
    return svc.overview()


@router.get("/tasks")
def tasks(limit: int = Query(default=20, ge=1, le=200), status: str = ""):
    return {"items": svc.list_tasks(limit=limit, status=status or None)}


@router.get("/tasks/{task_id}")
def task_detail(task_id: int):
    item = svc.get_task(task_id)
    if not item:
        raise HTTPException(status_code=404, detail="task not found")
    return item


@router.get("/tasks/{task_id}/run")
def task_run(task_id: int):
    item = svc.get_task_run(task_id)
    if not item:
        raise HTTPException(status_code=404, detail="run not found")
    return item


@router.get("/tasks/{task_id}/steps")
def task_steps(task_id: int):
    return {"items": svc.get_task_steps(task_id)}


@router.get("/tasks/{task_id}/events")
def task_events(task_id: int, limit: int = Query(default=50, ge=1, le=500)):
    return {"items": svc.get_task_events(task_id, limit=limit)}


@router.get("/templates")
def templates(limit: int = Query(default=50, ge=1, le=200)):
    return {"items": svc.list_templates(limit=limit)}


@router.get("/agents")
def agents(limit: int = Query(default=50, ge=1, le=200)):
    return {"items": svc.list_agents(limit=limit)}


@router.get("/hooks")
def hooks(event_name: str = "", limit: int = Query(default=50, ge=1, le=200)):
    return {"items": svc.list_hooks(limit=limit, event_name=event_name or None)}


@router.get("/benchmark/top/{subject_type}")
def benchmark_top(subject_type: str, metric_name: str = "success", limit: int = Query(default=10, ge=1, le=100)):
    return {"items": svc.benchmark_top(subject_type=subject_type, metric_name=metric_name, limit=limit)}


@router.get("/services")
def services():
    return {"items": svc.services()}


@router.get("/config")
def config(prefix: str = ""):
    return {"items": svc.config(prefix=prefix or None)}

