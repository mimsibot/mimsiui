from __future__ import annotations

import json
import time
from functools import lru_cache
from urllib.request import Request, urlopen

import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, SecurityScopes

from app.core.settings import settings

bearer_scheme = HTTPBearer(auto_error=False)


class OIDCVerifier:
    def __init__(self) -> None:
        self._metadata: dict | None = None
        self._metadata_loaded_at = 0.0
        self._jwk_client: jwt.PyJWKClient | None = None
        self._jwks_uri = ""

    def verify_access_token(self, token: str, required_scopes: list[str]) -> dict:
        self._assert_configured()
        openid_config = self._get_openid_config()
        jwks_uri = openid_config.get("jwks_uri", "")
        if not jwks_uri:
            raise self._service_error("OIDC metadata does not expose jwks_uri.")
        if self._jwk_client is None or self._jwks_uri != jwks_uri:
            self._jwk_client = jwt.PyJWKClient(jwks_uri)
            self._jwks_uri = jwks_uri
        try:
            signing_key = self._jwk_client.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=settings.auth_audience,
                issuer=settings.auth_issuer,
                options={"require": ["exp", "iat", "sub"]},
            )
        except jwt.PyJWTError as exc:
            raise self._unauthorized(f"Token validation failed: {exc}") from exc
        self._assert_scopes(claims, required_scopes)
        return claims

    def _assert_configured(self) -> None:
        missing = []
        for key, value in {
            "AUTH_ISSUER": settings.auth_issuer,
            "AUTH_AUDIENCE": settings.auth_audience,
            "AUTH_CLIENT_ID": settings.auth_client_id,
        }.items():
            if not value:
                missing.append(key)
        if missing:
            raise self._service_error(f"OIDC auth is enabled but missing: {', '.join(missing)}")

    def _get_openid_config(self) -> dict:
        now = time.time()
        if self._metadata and (now - self._metadata_loaded_at) < settings.auth_metadata_ttl_seconds:
            return self._metadata
        url = settings.auth_issuer.rstrip("/") + "/.well-known/openid-configuration"
        self._metadata = self._fetch_json(url)
        self._metadata_loaded_at = now
        return self._metadata

    def _fetch_json(self, url: str) -> dict:
        try:
            request = Request(url, headers={"Accept": "application/json"})
            with urlopen(request, timeout=5) as response:
                payload = response.read().decode("utf-8")
        except Exception as exc:
            raise self._service_error(f"Failed to fetch OIDC metadata from {url}: {exc}") from exc
        return json.loads(payload)

    def _assert_scopes(self, claims: dict, required_scopes: list[str]) -> None:
        if not required_scopes:
            return
        granted = set()
        scope_value = claims.get("scope")
        if isinstance(scope_value, str):
            granted.update(scope_value.split())
        scp_value = claims.get("scp")
        if isinstance(scp_value, str):
            granted.update(scp_value.split())
        elif isinstance(scp_value, list):
            granted.update(item for item in scp_value if isinstance(item, str))
        missing = [scope for scope in required_scopes if scope not in granted]
        if missing:
            raise self._unauthorized(f"Missing required scopes: {', '.join(missing)}", required_scopes)

    def _unauthorized(self, detail: str, required_scopes: list[str] | None = None) -> HTTPException:
        scope_text = " ".join(required_scopes or [])
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": f'Bearer scope="{scope_text}"'.strip()},
        )

    def _service_error(self, detail: str) -> HTTPException:
        return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)


@lru_cache(maxsize=1)
def get_verifier() -> OIDCVerifier:
    return OIDCVerifier()


def get_current_claims(
    security_scopes: SecurityScopes,
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
) -> dict:
    if not settings.auth_enabled:
        return {"sub": "local-dev", "scope": settings.auth_required_scope}
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token required.",
            headers={"WWW-Authenticate": 'Bearer scope="mimsiui.read"'},
        )
    return get_verifier().verify_access_token(credentials.credentials, list(security_scopes.scopes))
