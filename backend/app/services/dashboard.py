import shutil
import subprocess
from pathlib import Path

from app.core.settings import settings
from app.db.sqlite import get_conn


class DashboardService:
    def overview(self) -> dict:
        with get_conn() as conn:
            task_counts = self._group_counts(conn, "auto_tasks", "status")
            bg_counts = self._group_counts(conn, "bg_processes", "status")
            plugin_rows = self._config_rows(conn, "plugins.")
            latest_hooks = conn.execute(
                "SELECT event_name, created_at FROM hook_events ORDER BY id DESC LIMIT 8"
            ).fetchall() if self._table_exists(conn, "hook_events") else []
            degraded_templates = conn.execute(
                """
                SELECT subject_key, AVG(metric_value) AS avg_value, COUNT(*) AS n
                FROM benchmark_runs
                WHERE subject_type='template' AND metric_name='success'
                GROUP BY subject_key
                HAVING COUNT(*) >= 3 AND AVG(metric_value) < 0.5
                ORDER BY avg_value ASC, n DESC
                LIMIT 10
                """
            ).fetchall() if self._table_exists(conn, "benchmark_runs") else []

        return {
            "system": self._system_snapshot(),
            "tasks": task_counts,
            "background": bg_counts,
            "plugins": [{"key": row["key"], "value": row["value"]} for row in plugin_rows],
            "latest_hooks": [dict(row) for row in latest_hooks],
            "degraded_templates": [dict(row) for row in degraded_templates],
        }

    def list_tasks(self, limit: int = 20, status: str | None = None) -> list[dict]:
        with get_conn() as conn:
            if status:
                rows = conn.execute(
                    """
                    SELECT id, title, goal, status, trigger, triggered_by, created_at, started_at, completed_at
                    FROM auto_tasks
                    WHERE status=?
                    ORDER BY id DESC LIMIT ?
                    """,
                    (status, limit),
                ).fetchall()
            else:
                rows = conn.execute(
                    """
                    SELECT id, title, goal, status, trigger, triggered_by, created_at, started_at, completed_at
                    FROM auto_tasks
                    ORDER BY id DESC LIMIT ?
                    """,
                    (limit,),
                ).fetchall()
        return [dict(row) for row in rows]

    def get_task(self, task_id: int) -> dict | None:
        with get_conn() as conn:
            row = conn.execute("SELECT * FROM auto_tasks WHERE id=?", (task_id,)).fetchone()
        return dict(row) if row else None

    def get_task_run(self, task_id: int) -> dict | None:
        with get_conn() as conn:
            row = conn.execute("SELECT * FROM task_runs WHERE auto_task_id=?", (task_id,)).fetchone()
        return dict(row) if row else None

    def get_task_steps(self, task_id: int) -> list[dict]:
        with get_conn() as conn:
            run = conn.execute("SELECT id FROM task_runs WHERE auto_task_id=?", (task_id,)).fetchone()
            if not run:
                return []
            rows = conn.execute(
                "SELECT * FROM task_steps WHERE run_id=? ORDER BY step_index ASC",
                (run["id"],),
            ).fetchall()
        return [dict(row) for row in rows]

    def get_task_events(self, task_id: int, limit: int = 50) -> list[dict]:
        with get_conn() as conn:
            run = conn.execute("SELECT id FROM task_runs WHERE auto_task_id=?", (task_id,)).fetchone()
            if not run:
                return []
            rows = conn.execute(
                "SELECT * FROM task_events WHERE run_id=? ORDER BY id DESC LIMIT ?",
                (run["id"], limit),
            ).fetchall()
        return [dict(row) for row in rows[::-1]]

    def list_templates(self, limit: int = 50) -> list[dict]:
        with get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM task_templates ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(row) for row in rows]

    def list_agents(self, limit: int = 50) -> list[dict]:
        with get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM custom_agents ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(row) for row in rows]

    def list_hooks(self, limit: int = 50, event_name: str | None = None) -> list[dict]:
        with get_conn() as conn:
            if event_name:
                rows = conn.execute(
                    "SELECT * FROM hook_events WHERE event_name=? ORDER BY id DESC LIMIT ?",
                    (event_name, limit),
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM hook_events ORDER BY id DESC LIMIT ?",
                    (limit,),
                ).fetchall()
        return [dict(row) for row in rows]

    def benchmark_top(self, subject_type: str, metric_name: str = "success", limit: int = 10) -> list[dict]:
        with get_conn() as conn:
            rows = conn.execute(
                """
                SELECT subject_key, AVG(metric_value) AS avg_value, COUNT(*) AS n
                FROM benchmark_runs
                WHERE subject_type=? AND metric_name=?
                GROUP BY subject_key
                ORDER BY avg_value DESC, n DESC
                LIMIT ?
                """,
                (subject_type, metric_name, limit),
            ).fetchall()
        return [dict(row) for row in rows]

    def services(self) -> list[dict]:
        names = ["mimsibot.service", "ollama.service", "tailscaled.service"]
        items = []
        for name in names:
            state = self._cmd(["systemctl", "is-active", name]) or "unknown"
            items.append({"name": name, "state": state})
        return items

    def config(self, prefix: str | None = None) -> list[dict]:
        with get_conn() as conn:
            rows = self._config_rows(conn, prefix or "")
        return [dict(row) for row in rows]

    def _system_snapshot(self) -> dict:
        usage = shutil.disk_usage("/")
        return {
            "root": settings.mimsibot_root,
            "db_path": settings.mimsibot_db_path,
            "disk_free_gb": round(usage.free / 1e9, 2),
            "disk_total_gb": round(usage.total / 1e9, 2),
            "tailscale_ip": self._cmd(["tailscale", "ip", "-4"]),
            "git_branch": self._cmd(["git", "-C", settings.mimsibot_root, "branch", "--show-current"]),
            "git_head": self._cmd(["git", "-C", settings.mimsibot_root, "rev-parse", "--short", "HEAD"]),
        }

    def _cmd(self, cmd: list[str]) -> str:
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            if res.returncode != 0:
                return ""
            return (res.stdout or "").strip()
        except Exception:
            return ""

    def _group_counts(self, conn, table: str, column: str) -> dict:
        if not self._table_exists(conn, table):
            return {}
        rows = conn.execute(
            f"SELECT {column}, COUNT(*) AS n FROM {table} GROUP BY {column}"
        ).fetchall()
        return {row[0]: row[1] for row in rows}

    def _table_exists(self, conn, table: str) -> bool:
        row = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
            (table,),
        ).fetchone()
        return bool(row)

    def _config_rows(self, conn, prefix: str) -> list:
        if not self._table_exists(conn, "bot_config"):
            return []
        if prefix:
            return conn.execute(
                "SELECT key, value FROM bot_config WHERE key LIKE ? ORDER BY key ASC",
                (f"{prefix}%",),
            ).fetchall()
        return conn.execute("SELECT key, value FROM bot_config ORDER BY key ASC").fetchall()

