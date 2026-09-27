from __future__ import annotations

import os
import tempfile
from urllib.parse import urlparse, urlunparse

# Prefer explicit TEST_DATABASE_URL; fall back to Postgres; if unreachable → SQLite.
_DEFAULT_PG = "postgresql+psycopg2://b2b:b2b_pass@localhost:5432/b2b_match_test"
_sqlite_path = tempfile.mktemp(prefix="b2b_test_", suffix=".db")
_DEFAULT_SQLITE = f"sqlite:///{_sqlite_path}"

if "DATABASE_URL" not in os.environ and "TEST_DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", _DEFAULT_PG)
elif "TEST_DATABASE_URL" in os.environ:
    os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]

os.environ["FILES_DIR"] = tempfile.mkdtemp(prefix="b2b_files_")
os.environ["DEV_MODE"] = "1"
os.environ["JWT_SECRET"] = "test-secret-key-for-hackathon-demo-0123456789"
os.environ["BOT_TOKEN"] = ""
os.environ["MAX_ADMIN_USER_IDS"] = "7777001"

from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.exc import OperationalError  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


def _can_connect(url: str) -> bool:
    probe = create_engine(url)
    try:
        with probe.connect():
            return True
    except OperationalError:
        return False
    finally:
        probe.dispose()


def ensure_test_database(url: str) -> str:
    """Ensure Postgres test DB exists, or fall back to SQLite for offline runs."""
    if url.startswith("sqlite"):
        return url
    if _can_connect(url):
        return url

    # Try create DB on server
    try:
        parts = urlparse(url.replace("postgresql+psycopg2://", "postgresql://"))
        dbname = parts.path.lstrip("/")
        base = urlunparse(parts._replace(path="/postgres"))
        admin = create_engine(base, isolation_level="AUTOCOMMIT")
        with admin.connect() as conn:
            exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname=:n"), {"n": dbname}).scalar()
            if not exists:
                conn.execute(text(f'CREATE DATABASE "{dbname}"'))
        admin.dispose()
        if _can_connect(url):
            return url
    except Exception:
        pass

    print(f"[conftest] Postgres unavailable ({url}); using SQLite {_DEFAULT_SQLITE}")
    os.environ["DATABASE_URL"] = _DEFAULT_SQLITE
    return _DEFAULT_SQLITE


@pytest.fixture(scope="session", autouse=True)
def _database():
    url = ensure_test_database(os.environ["DATABASE_URL"])
    os.environ["DATABASE_URL"] = url

    # Re-bind engine after possible DATABASE_URL swap
    import backend_max.app.db as db_mod
    from backend_max.app.db import Base, init_db
    from backend_max.app.config import get_settings

    get_settings.cache_clear()  # type: ignore[attr-defined]
    db_mod.engine = db_mod._engine()
    db_mod.SessionLocal.configure(bind=db_mod.engine)

    Base.metadata.drop_all(bind=db_mod.engine)
    init_db()
    yield
    Base.metadata.drop_all(bind=db_mod.engine)


class _ApiPrefixedClient:
    """TestClient wrapper: business paths get /api prefix; /health and /api/* untouched."""

    _META_PREFIXES = ("/docs", "/redoc", "/openapi.json")
    _META_EXACT = {"/", "/health"}

    def __init__(self, client: TestClient):
        self._client = client

    def _path(self, url: str) -> str:
        if (
            url.startswith("/api/")
            or url in self._META_EXACT
            or any(url.startswith(p) for p in self._META_PREFIXES)
        ):
            return url
        if url.startswith("/"):
            return "/api" + url
        return url

    def get(self, url, **kwargs):
        return self._client.get(self._path(url), **kwargs)

    def post(self, url, **kwargs):
        return self._client.post(self._path(url), **kwargs)

    def put(self, url, **kwargs):
        return self._client.put(self._path(url), **kwargs)

    def patch(self, url, **kwargs):
        return self._client.patch(self._path(url), **kwargs)

    def delete(self, url, **kwargs):
        return self._client.delete(self._path(url), **kwargs)

    def request(self, method, url, **kwargs):
        return self._client.request(method, self._path(url), **kwargs)


@pytest.fixture(scope="session")
def client(_database):
    from backend_max.app.main import app

    with TestClient(app) as c:
        yield _ApiPrefixedClient(c)


@pytest.fixture()
def login(client):
    def _login(max_user_id: int, first_name: str = "Тест") -> dict:
        response = client.post(
            "/auth/max",
            json={"dev_max_user_id": max_user_id, "dev_first_name": first_name},
        )
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}
    return _login


@pytest.fixture()
def company_payload_factory():
    def _make(name: str, industries: list[str], **overrides) -> dict:
        payload = {
            "name": name,
            "description": f"Тестовая компания {name}",
            "industries": industries,
            "services": [],
            "competencies": [],
            "regions": ["Москва"],
            "budget_min": 100_000,
            "budget_max": 1_000_000,
            "max_term_days": 60,
            "cases": [],
            "certificates": [],
        }
        payload.update(overrides)
        return payload
    return _make
