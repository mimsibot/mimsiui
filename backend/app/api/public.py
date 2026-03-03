from fastapi import APIRouter

from app.core.settings import settings

router = APIRouter()


@router.get("/auth/config")
def auth_config():
    return {
        "enabled": settings.auth_enabled,
        "issuer": settings.auth_issuer,
        "audience": settings.auth_audience,
        "client_id": settings.auth_client_id,
        "required_scope": settings.auth_required_scope,
        "admin_scope": settings.auth_admin_scope,
    }
