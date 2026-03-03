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


@contextmanager
def get_rw_conn():
    conn = sqlite3.connect(settings.mimsibot_db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
