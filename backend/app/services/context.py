from app.db.sqlite import get_conn


class ContextService:
    def overview(self) -> dict:
        with get_conn() as conn:
            memories = (
                conn.execute(
                    """
                    SELECT id, scope_type, scope_key, title, content, importance, created_at
                    FROM memory_entries
                    ORDER BY importance DESC, id DESC
                    LIMIT 12
                    """
                ).fetchall()
                if self._table_exists(conn, "memory_entries")
                else []
            )
            agents = (
                conn.execute(
                    """
                    SELECT id, name, role, active, version_count, updated_at, last_used_at
                    FROM custom_agents
                    ORDER BY COALESCE(last_used_at, updated_at, created_at) DESC
                    LIMIT 10
                    """
                ).fetchall()
                if self._table_exists(conn, "custom_agents")
                else []
            )
            recent_tasks = (
                conn.execute(
                    """
                    SELECT id, title, status, trigger, triggered_by, created_at
                    FROM auto_tasks
                    ORDER BY id DESC
                    LIMIT 10
                    """
                ).fetchall()
                if self._table_exists(conn, "auto_tasks")
                else []
            )
        return {
            "memories": [dict(row) for row in memories],
            "agents": [dict(row) for row in agents],
            "recent_tasks": [dict(row) for row in recent_tasks],
        }

    def search_memories(self, query: str, limit: int = 20) -> list[dict]:
        pattern = f"%{query}%"
        with get_conn() as conn:
            if not self._table_exists(conn, "memory_entries"):
                return []
            rows = conn.execute(
                """
                SELECT id, scope_type, scope_key, title, content, importance, created_at
                FROM memory_entries
                WHERE title LIKE ? OR content LIKE ?
                ORDER BY importance DESC, id DESC
                LIMIT ?
                """,
                (pattern, pattern, limit),
            ).fetchall()
        return [dict(row) for row in rows]

    def _table_exists(self, conn, table: str) -> bool:
        row = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
            (table,),
        ).fetchone()
        return bool(row)
