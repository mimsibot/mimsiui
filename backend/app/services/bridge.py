import json

from app.core.settings import settings
from app.db.sqlite import get_conn, get_rw_conn


class BridgeService:
    def ensure_schema(self) -> None:
        with get_rw_conn() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS ui_bridge_requests (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    source          TEXT DEFAULT 'mimsiui',
                    requester_sub   TEXT DEFAULT '',
                    requester_name  TEXT DEFAULT '',
                    requester_email TEXT DEFAULT '',
                    title           TEXT NOT NULL,
                    goal            TEXT NOT NULL,
                    requested_scope TEXT DEFAULT '',
                    status          TEXT DEFAULT 'pending',
                    task_id         INTEGER,
                    error           TEXT DEFAULT '',
                    payload_json    TEXT DEFAULT '',
                    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                    claimed_at      DATETIME,
                    processed_at    DATETIME
                );
                CREATE INDEX IF NOT EXISTS idx_ui_bridge_requests_status
                    ON ui_bridge_requests(status, created_at);
                """
            )

    def create_task_request(self, claims: dict, title: str, goal: str) -> dict:
        self.ensure_schema()
        with get_rw_conn() as conn:
            cur = conn.execute(
                """
                INSERT INTO ui_bridge_requests(
                    source,
                    requester_sub,
                    requester_name,
                    requester_email,
                    title,
                    goal,
                    requested_scope,
                    payload_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    settings.bridge_source,
                    claims.get("sub", ""),
                    claims.get("name", ""),
                    claims.get("email", ""),
                    title.strip(),
                    goal.strip(),
                    settings.auth_admin_scope,
                    json.dumps({"claims": claims}, ensure_ascii=False)[:4000],
                ),
            )
            request_id = int(cur.lastrowid)
        return {"request_id": request_id, "status": "pending", "task_id": None}

    def list_requests(self, requester_sub: str = "", limit: int = 20) -> list[dict]:
        with get_conn() as conn:
            if not self._table_exists(conn, "ui_bridge_requests"):
                return []
            if requester_sub:
                rows = conn.execute(
                    """
                    SELECT id, source, requester_sub, requester_name, requester_email, title, goal, status, task_id, error, created_at, processed_at
                    FROM ui_bridge_requests
                    WHERE requester_sub=?
                    ORDER BY id DESC LIMIT ?
                    """,
                    (requester_sub, limit),
                ).fetchall()
            else:
                rows = conn.execute(
                    """
                    SELECT id, source, requester_sub, requester_name, requester_email, title, goal, status, task_id, error, created_at, processed_at
                    FROM ui_bridge_requests
                    ORDER BY id DESC LIMIT ?
                    """,
                    (limit,),
                ).fetchall()
        return [dict(row) for row in rows]

    def get_request(self, request_id: int) -> dict | None:
        with get_conn() as conn:
            if not self._table_exists(conn, "ui_bridge_requests"):
                return None
            row = conn.execute(
                """
                SELECT id, source, requester_sub, requester_name, requester_email, title, goal, status, task_id, error, created_at, processed_at
                FROM ui_bridge_requests
                WHERE id=?
                """,
                (request_id,),
            ).fetchone()
        return dict(row) if row else None

    def _table_exists(self, conn, table: str) -> bool:
        row = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
            (table,),
        ).fetchone()
        return bool(row)
