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
            CREATE TABLE IF NOT EXISTS ui_chat_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT DEFAULT 'mimsiui',
                requester_sub TEXT DEFAULT '',
                requester_name TEXT DEFAULT '',
                requester_email TEXT DEFAULT '',
                title TEXT DEFAULT '',
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_message_at DATETIME
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ui_chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                sender TEXT NOT NULL,
                content TEXT NOT NULL,
                status TEXT DEFAULT 'done',
                route_used TEXT DEFAULT '',
                error TEXT DEFAULT '',
                metadata_json TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                processed_at DATETIME
            )
            """
        )


def _mock_auth(monkeypatch, sub: str = "user-1"):
    monkeypatch.setattr(settings, "auth_enabled", True)

    class FakeVerifier:
        def verify_access_token(self, token: str, required_scopes: list[str]) -> dict:
            return {
                "sub": sub,
                "email": "user@example.com",
                "email_verified": True,
                "scope": f"{settings.auth_required_scope} {settings.auth_admin_scope}",
            }

    monkeypatch.setattr(oidc, "get_verifier", lambda: FakeVerifier())


def test_create_and_list_chat_messages(tmp_path, monkeypatch):
    db_path = str(tmp_path / "tasks.db")
    _prepare_db(db_path)
    monkeypatch.setattr(settings, "mimsibot_db_path", db_path)
    _mock_auth(monkeypatch)

    created = client.post("/api/v1/chat/sessions", headers={"Authorization": "Bearer good-token"}, json={"title": "Ops"})
    assert created.status_code == 201
    session_id = created.json()["session_id"]

    posted = client.post(
        f"/api/v1/chat/sessions/{session_id}/messages",
        headers={"Authorization": "Bearer good-token"},
        json={"content": "Hola bot"},
    )
    assert posted.status_code == 202

    listed = client.get(f"/api/v1/chat/sessions/{session_id}/messages", headers={"Authorization": "Bearer good-token"})
    assert listed.status_code == 200
    items = listed.json()["items"]
    assert len(items) == 1
    assert items[0]["sender"] == "user"
    assert items[0]["status"] == "pending"
