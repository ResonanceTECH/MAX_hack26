from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    pass


def _engine():
    return create_engine(
        get_settings().database_url,
        future=True,
        pool_pre_ping=True,
    )


engine = _engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

# Лёгкие миграции: добавление новых колонок к существующим таблицам
# (create_all не меняет уже созданные таблицы). Для MVP достаточно;
# для продакшена — Alembic.
_MIGRATIONS = [
    "ALTER TABLE companies ADD COLUMN IF NOT EXISTS registration_date DATE",
    "ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_status VARCHAR(100)",
    "ALTER TABLE companies ADD COLUMN IF NOT EXISTS verification_source VARCHAR(500)",
    "ALTER TABLE requests ADD COLUMN IF NOT EXISTS required_certificates JSON",
    "ALTER TABLE files ADD COLUMN IF NOT EXISTS opportunity_id INTEGER",
    "ALTER TABLE files ADD COLUMN IF NOT EXISTS deal_id INTEGER",
]


def init_db() -> None:
    from . import models  # noqa: F401  регистрация моделей

    Base.metadata.create_all(bind=engine)
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            for statement in _MIGRATIONS:
                conn.execute(text(statement))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
