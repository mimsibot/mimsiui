from app.core.settings import settings
from app.db.sqlite import get_conn, get_rw_conn


class ChatService:
    def ensure_schema(self) -> None:
        with get_rw_conn() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS ui_chat_sessions (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    source          TEXT DEFAULT 'mimsiui',
                    requester_sub   TEXT DEFAULT '',
                    requester_name  TEXT DEFAULT '',
                    requester_email TEXT DEFAULT '',
                    title           TEXT DEFAULT '',
                    status          TEXT DEFAULT 'active',
                    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_message_at DATETIME
                );
                CREATE TABLE IF NOT EXISTS ui_chat_messages (
                    id            INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id    INTEGER NOT NULL,
                    sender        TEXT NOT NULL,
                    content       TEXT NOT NULL,
                    status        TEXT DEFAULT 'done',
                    route_used    TEXT DEFAULT '',
                    error         TEXT DEFAULT '',
                    metadata_json TEXT DEFAULT '',
                    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
                    processed_at  DATETIME,
                    FOREIGN KEY(session_id) REFERENCES ui_chat_sessions(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_ui_chat_sessions_subject
                    ON ui_chat_sessions(requester_sub, updated_at);
                CREATE INDEX IF NOT EXISTS idx_ui_chat_messages_session
                    ON ui_chat_messages(session_id, id);
                """
            )

    def create_session(self, claims: dict, title: str = "") -> dict:
        self.ensure_schema()
        with get_rw_conn() as conn:
            cur = conn.execute(
                """
                INSERT INTO ui_chat_sessions(
                    source, requester_sub, requester_name, requester_email, title, status, last_message_at
                ) VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
                """,
                (
                    settings.bridge_source,
                    claims.get("sub", ""),
                    claims.get("name", ""),
                    claims.get("email", ""),
                    title.strip()[:120],
                ),
            )
            session_id = int(cur.lastrowid)
        return {"session_id": session_id, "status": "active"}

    def list_sessions(self, requester_sub: str, limit: int = 20) -> list[dict]:
        with get_conn() as conn:
            if not self._table_exists(conn, "ui_chat_sessions"):
                return []
            rows = conn.execute(
                """
                SELECT id, title, status, created_at, updated_at, last_message_at
                FROM ui_chat_sessions
                WHERE requester_sub=?
                ORDER BY updated_at DESC, id DESC
                LIMIT ?
                """,
                (requester_sub, limit),
            ).fetchall()
        return [dict(row) for row in rows]

    def get_session(self, session_id: int, requester_sub: str) -> dict | None:
        with get_conn() as conn:
            if not self._table_exists(conn, "ui_chat_sessions"):
                return None
            row = conn.execute(
                """
                SELECT id, title, status, created_at, updated_at, last_message_at
                FROM ui_chat_sessions
                WHERE id=? AND requester_sub=?
                """,
                (session_id, requester_sub),
            ).fetchone()
        return dict(row) if row else None

    def list_messages(self, session_id: int, requester_sub: str, limit: int = 100) -> list[dict]:
        if not self.get_session(session_id, requester_sub):
            return []
        with get_conn() as conn:
            rows = conn.execute(
                """
                SELECT id, session_id, sender, content, status, route_used, error, created_at, processed_at
                FROM ui_chat_messages
                WHERE session_id=?
                ORDER BY id ASC
                LIMIT ?
                """,
                (session_id, limit),
            ).fetchall()
        return [dict(row) for row in rows]

    def post_message(self, session_id: int, requester_sub: str, content: str) -> dict | None:
        session = self.get_session(session_id, requester_sub)
        if not session:
            return None
        with get_rw_conn() as conn:
            cur = conn.execute(
                """
                INSERT INTO ui_chat_messages(session_id, sender, content, status, metadata_json)
                VALUES (?, 'user', ?, 'pending', '{}')
                """,
                (session_id, content.strip()[:6000]),
            )
            message_id = int(cur.lastrowid)
            conn.execute(
                """
                UPDATE ui_chat_sessions
                SET updated_at=CURRENT_TIMESTAMP, last_message_at=CURRENT_TIMESTAMP,
                    title=CASE
                        WHEN title='' THEN substr(?, 1, 80)
                        ELSE title
                    END
                WHERE id=?
                """,
                (content.strip(), session_id),
            )
        return {"message_id": message_id, "status": "pending"}

    def _table_exists(self, conn, table: str) -> bool:
        row = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
            (table,),
        ).fetchone()
        return bool(row)
