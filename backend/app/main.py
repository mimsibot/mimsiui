from fastapi import FastAPI

from app.api.routes import router

app = FastAPI(
    title="mimsiui API",
    version="0.1.0",
    description="Read-only dashboard API para mimsibot",
)

app.include_router(router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"ok": True}

