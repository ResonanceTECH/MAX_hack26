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

_MIGRATIONS = [
    "ALTER TABLE companies ADD COLUMN IF NOT EXISTS registration_date DATE",
    "ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_status VARCHAR(100)",
    "ALTER TABLE companies ADD COLUMN IF NOT EXISTS verification_source VARCHAR(500)",
    "ALTER TABLE companies ADD COLUMN IF NOT EXISTS platform_status VARCHAR(20) DEFAULT 'ACTIVE'",
    "ALTER TABLE companies ADD COLUMN IF NOT EXISTS verification_status VARCHAR(32) DEFAULT 'NOT_VERIFIED'",
    "ALTER TABLE companies ADD COLUMN IF NOT EXISTS settings_json JSONB DEFAULT '{}'::jsonb",
    "ALTER TABLE requests ADD COLUMN IF NOT EXISTS required_certificates JSON",
    "ALTER TABLE files ADD COLUMN IF NOT EXISTS opportunity_id INTEGER",
    "ALTER TABLE files ADD COLUMN IF NOT EXISTS deal_id INTEGER",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'BUSINESS_USER'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ",
    "ALTER TABLE escalations ADD COLUMN IF NOT EXISTS resolution TEXT",
    "ALTER TABLE escalations ADD COLUMN IF NOT EXISTS admin_response TEXT",
    "ALTER TABLE opportunity_invites ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'",
    "ALTER TABLE opportunity_invites ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ",
    "ALTER TABLE company_members ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64)",
    "ALTER TABLE company_members ADD COLUMN IF NOT EXISTS invited_by_user_id INTEGER",
    "ALTER TABLE company_members ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ",
    "ALTER TABLE company_members ADD COLUMN IF NOT EXISTS message TEXT",
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_company_members_invite_token ON company_members (invite_token)",
    "UPDATE users SET role = 'PLATFORM_ADMIN' WHERE is_admin = true AND (role IS NULL OR role = 'BUSINESS_USER')",
    "UPDATE company_services SET status='published' WHERE status='active'",
    "UPDATE company_services SET status='archived' WHERE status='inactive'",
    "UPDATE company_services SET status='published' WHERE status='PUBLISHED'",
    "UPDATE company_services SET status='draft' WHERE status='DRAFT'",
    "UPDATE company_services SET status='hidden' WHERE status='HIDDEN'",
    "UPDATE company_services SET status='archived' WHERE status='ARCHIVED'",
    "UPDATE company_cases SET status='published' WHERE status='PUBLISHED'",
    "UPDATE company_cases SET status='draft' WHERE status='DRAFT'",
    "UPDATE company_cases SET status='hidden' WHERE status='HIDDEN'",
    "UPDATE company_cases SET status='archived' WHERE status='ARCHIVED'",
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
