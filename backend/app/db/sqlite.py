import sqlite3
from contextlib import contextmanager

from app.core.settings import settings


@contextmanager
def get_conn():
    conn = sqlite3.connect(f"file:{settings.mimsibot_db_path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

