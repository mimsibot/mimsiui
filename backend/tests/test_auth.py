from fastapi.testclient import TestClient

from app.core.settings import settings
from app.main import app
from app.security import oidc

client = TestClient(app)


def test_auth_config_is_public(monkeypatch):
    monkeypatch.setattr(settings, "auth_enabled", True)
    response = client.get("/api/v1/auth/config")
    assert response.status_code == 200
    assert "client_id" in response.json()


def test_protected_route_rejects_missing_bearer(monkeypatch):
    monkeypatch.setattr(settings, "auth_enabled", True)
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_protected_route_accepts_verified_claims(monkeypatch):
    monkeypatch.setattr(settings, "auth_enabled", True)

    class FakeVerifier:
        def verify_access_token(self, token: str, required_scopes: list[str]) -> dict:
            assert token == "good-token"
            assert "mimsiui.read" in required_scopes
            return {"sub": "tester", "scope": "openid profile mimsiui.read", "email_verified": True}

    monkeypatch.setattr(oidc, "get_verifier", lambda: FakeVerifier())
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer good-token"})
    assert response.status_code == 200
    assert response.json()["subject"] == "tester"
