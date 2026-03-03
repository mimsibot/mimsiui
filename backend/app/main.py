from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import public_router, protected_router
from app.core.settings import settings

app = FastAPI(
    title="mimsiui API",
    version="0.1.0",
    description="Dashboard and control-plane API para mimsibot",
)

if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

app.include_router(public_router, prefix="/api/v1")
app.include_router(protected_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"ok": True, "service": "mimsiui-api"}
