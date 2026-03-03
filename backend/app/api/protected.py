from fastapi import APIRouter, HTTPException, Query, Security

from app.core.settings import settings
from app.schemas.bridge import BridgeRequestResponse, CreateTaskRequest
from app.schemas.chat import ChatSessionResponse, CreateChatMessageRequest, CreateChatSessionRequest
from app.security.oidc import get_current_claims, get_write_claims
from app.services.bridge import BridgeService
from app.services.chat import ChatService
from app.services.context import ContextService
from app.services.dashboard import DashboardService

svc = DashboardService()
bridge = BridgeService()
chat = ChatService()
context_service = ContextService()
router = APIRouter()
read_access = Security(get_current_claims, scopes=[settings.auth_required_scope])
write_access = Security(get_write_claims, scopes=[settings.auth_admin_scope])


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


@router.get("/bridge/requests")
def bridge_requests(limit: int = Query(default=20, ge=1, le=100), claims: dict = read_access):
    return {"items": bridge.list_requests(requester_sub=claims.get("sub", ""), limit=limit)}


@router.get("/bridge/requests/{request_id}")
def bridge_request_detail(request_id: int, claims: dict = read_access):
    item = bridge.get_request(request_id)
    if not item or item.get("requester_sub") != claims.get("sub"):
        raise HTTPException(status_code=404, detail="bridge request not found")
    return item


@router.post("/bridge/tasks", response_model=BridgeRequestResponse, status_code=202)
def bridge_create_task(payload: CreateTaskRequest, claims: dict = write_access):
    return bridge.create_task_request(claims, title=payload.title, goal=payload.goal)


@router.get("/chat/sessions")
def chat_sessions(limit: int = Query(default=20, ge=1, le=100), claims: dict = read_access):
    return {"items": chat.list_sessions(requester_sub=claims.get("sub", ""), limit=limit)}


@router.post("/chat/sessions", response_model=ChatSessionResponse, status_code=201)
def create_chat_session(payload: CreateChatSessionRequest, claims: dict = write_access):
    return chat.create_session(claims, title=payload.title)


@router.get("/chat/sessions/{session_id}")
def chat_session_detail(session_id: int, claims: dict = read_access):
    item = chat.get_session(session_id, requester_sub=claims.get("sub", ""))
    if not item:
        raise HTTPException(status_code=404, detail="chat session not found")
    return item


@router.get("/chat/sessions/{session_id}/messages")
def chat_messages(session_id: int, limit: int = Query(default=100, ge=1, le=300), claims: dict = read_access):
    session = chat.get_session(session_id, requester_sub=claims.get("sub", ""))
    if not session:
        raise HTTPException(status_code=404, detail="chat session not found")
    return {"items": chat.list_messages(session_id, requester_sub=claims.get("sub", ""), limit=limit)}


@router.post("/chat/sessions/{session_id}/messages", status_code=202)
def create_chat_message(session_id: int, payload: CreateChatMessageRequest, claims: dict = write_access):
    item = chat.post_message(session_id, requester_sub=claims.get("sub", ""), content=payload.content)
    if not item:
        raise HTTPException(status_code=404, detail="chat session not found")
    return item


@router.get("/context/overview")
def context_overview(claims: dict = read_access):
    return context_service.overview()


@router.get("/context/search")
def context_search(query: str = Query(min_length=2), limit: int = Query(default=20, ge=1, le=50), claims: dict = read_access):
    return {"items": context_service.search_memories(query=query, limit=limit)}
