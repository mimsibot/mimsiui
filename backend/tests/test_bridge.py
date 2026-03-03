import sqlite3

from fastapi.testclient import TestClient

from app.core.settings import settings
from app.main import app
from app.security import oidc

client = TestClient(app)


def _prepare_db(path: str):
    with sqlite3.connect(path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ui_bridge_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT DEFAULT 'mimsiui',
                requester_sub TEXT DEFAULT '',
                requester_name TEXT DEFAULT '',
                requester_email TEXT DEFAULT '',
                title TEXT NOT NULL,
                goal TEXT NOT NULL,
                requested_scope TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
                task_id INTEGER,
                error TEXT DEFAULT '',
                payload_json TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                claimed_at DATETIME,
                processed_at DATETIME
            )
            """
        )


def test_create_bridge_task_request(tmp_path, monkeypatch):
    db_path = str(tmp_path / "tasks.db")
    _prepare_db(db_path)
    monkeypatch.setattr(settings, "mimsibot_db_path", db_path)
    monkeypatch.setattr(settings, "auth_enabled", True)

    class FakeVerifier:
        def verify_access_token(self, token: str, required_scopes: list[str]) -> dict:
            assert token == "good-token"
            assert settings.auth_admin_scope in required_scopes
            return {"sub": "user-1", "email": "user@example.com", "scope": f"{settings.auth_required_scope} {settings.auth_admin_scope}"}

    monkeypatch.setattr(oidc, "get_verifier", lambda: FakeVerifier())
    response = client.post(
        "/api/v1/bridge/tasks",
        headers={"Authorization": "Bearer good-token"},
        json={"title": "Revisar backlog", "goal": "Analiza la cola de tareas y propon prioridades."},
    )
    assert response.status_code == 202
    payload = response.json()
    assert payload["status"] == "pending"


def test_list_bridge_requests_is_scoped_to_subject(tmp_path, monkeypatch):
    db_path = str(tmp_path / "tasks.db")
    _prepare_db(db_path)
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            INSERT INTO ui_bridge_requests(requester_sub, title, goal, status)
            VALUES ('user-1', 'A', 'Goal A', 'pending'),
                   ('user-2', 'B', 'Goal B', 'pending')
            """
        )
    monkeypatch.setattr(settings, "mimsibot_db_path", db_path)
    monkeypatch.setattr(settings, "auth_enabled", True)

    class FakeVerifier:
        def verify_access_token(self, token: str, required_scopes: list[str]) -> dict:
            return {"sub": "user-1", "scope": settings.auth_required_scope}

    monkeypatch.setattr(oidc, "get_verifier", lambda: FakeVerifier())
    response = client.get("/api/v1/bridge/requests", headers={"Authorization": "Bearer read-token"})
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["requester_sub"] == "user-1"
