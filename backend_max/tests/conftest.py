from __future__ import annotations

import os
import tempfile
from urllib.parse import urlparse, urlunparse

os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://b2b:b2b_pass@localhost:5432/b2b_match_test",
)
os.environ["FILES_DIR"] = tempfile.mkdtemp(prefix="b2b_files_")
os.environ["DEV_MODE"] = "1"
os.environ["JWT_SECRET"] = "test-secret-key-for-hackathon-demo-0123456789"
os.environ["BOT_TOKEN"] = ""
os.environ["MAX_ADMIN_USER_IDS"] = "7777001"

from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.exc import OperationalError  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from backend_max.app.db import Base, engine, init_db  # noqa: E402
from backend_max.app.main import app  # noqa: E402


def ensure_test_database(url: str) -> None:
    """Создаёт тестовую БД, если её нет (нужен запущенный PostgreSQL)."""
    probe = create_engine(url)
    try:
        with probe.connect():
            return
    except OperationalError:
        pass
    finally:
        probe.dispose()

    parts = urlparse(url.replace("postgresql+psycopg2://", "postgresql://"))
    dbname = parts.path.lstrip("/")
    base = urlunparse(parts._replace(path="/postgres"))
    admin = create_engine(base, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(text(f'CREATE DATABASE "{dbname}"'))
    admin.dispose()


@pytest.fixture(scope="session", autouse=True)
def _database():
    ensure_test_database(os.environ["DATABASE_URL"])
    Base.metadata.drop_all(bind=engine)
    init_db()
    yield


@pytest.fixture(scope="session")
def client(_database):
    with TestClient(app) as c:
        yield c


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
