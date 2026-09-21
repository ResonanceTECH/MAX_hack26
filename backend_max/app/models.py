from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, relationship

from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = Column(Integer, primary_key=True)
    max_user_id: Mapped[int] = Column(Integer, unique=True, index=True)
    first_name: Mapped[str | None] = Column(String(255), nullable=True)
    last_name: Mapped[str | None] = Column(String(255), nullable=True)
    username: Mapped[str | None] = Column(String(255), nullable=True)
    is_admin: Mapped[bool] = Column(Boolean, default=False)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)

    company: Mapped["Company | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = Column(Integer, primary_key=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), unique=True, index=True)

    name: Mapped[str] = Column(String(255), index=True)
    inn: Mapped[str | None] = Column(String(20), nullable=True, unique=True)
    description: Mapped[str | None] = Column(Text, nullable=True)

    # Verified Business: данные верификации (модельные, из ЕГРЮЛ/источников)
    registration_date: Mapped[date | None] = Column(Date, nullable=True)
    company_status: Mapped[str | None] = Column(String(100), nullable=True)
    verification_source: Mapped[str | None] = Column(String(500), nullable=True)

    industries: Mapped[list] = Column(JSON, default=list)
    services: Mapped[list] = Column(JSON, default=list)
    competencies: Mapped[list] = Column(JSON, default=list)
    regions: Mapped[list] = Column(JSON, default=list)

    budget_min: Mapped[int | None] = Column(Integer, nullable=True)
    budget_max: Mapped[int | None] = Column(Integer, nullable=True)
    max_term_days: Mapped[int | None] = Column(Integer, nullable=True)

    cases: Mapped[list] = Column(JSON, default=list)
    certificates: Mapped[list] = Column(JSON, default=list)

    website: Mapped[str | None] = Column(String(500), nullable=True)
    phone: Mapped[str | None] = Column(String(50), nullable=True)
    email: Mapped[str | None] = Column(String(255), nullable=True)

    rating: Mapped[float] = Column(Float, default=0.0)
    is_verified: Mapped[bool] = Column(Boolean, default=False)

    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    user: Mapped["User"] = relationship(back_populates="company")


class Request(Base):
    """Business Opportunity: заказ / потребность бизнеса."""

    __tablename__ = "requests"

    id: Mapped[int] = Column(Integer, primary_key=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), index=True)

    title: Mapped[str] = Column(String(500))
    description_raw: Mapped[str | None] = Column(Text, nullable=True)

    category: Mapped[str] = Column(String(255), index=True)
    subcategory: Mapped[str | None] = Column(String(255), nullable=True)
    requirements: Mapped[list] = Column(JSON, default=list)
    required_certificates: Mapped[list] = Column(JSON, default=list)

    budget_min: Mapped[int | None] = Column(Integer, nullable=True)
    budget_max: Mapped[int | None] = Column(Integer, nullable=True)
    deadline_days: Mapped[int | None] = Column(Integer, nullable=True)
    regions: Mapped[list] = Column(JSON, default=list)

    proposals_deadline_days: Mapped[int] = Column(Integer, default=14)

    status: Mapped[str] = Column(String(20), default="published", index=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    published_at: Mapped[datetime | None] = Column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = Column(DateTime(timezone=True), nullable=True)

    matches: Mapped[list["RequestMatch"]] = relationship(
        back_populates="request", cascade="all, delete-orphan"
    )
    proposals: Mapped[list["Proposal"]] = relationship(
        back_populates="request", cascade="all, delete-orphan"
    )


class RequestMatch(Base):
    """Предвычисленный результат матчинга запроса и компании."""

    __tablename__ = "request_matches"
    __table_args__ = (UniqueConstraint("request_id", "company_id", name="uq_request_company"),)

    id: Mapped[int] = Column(Integer, primary_key=True)
    request_id: Mapped[int] = Column(Integer, ForeignKey("requests.id"), index=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), index=True)
    score: Mapped[int] = Column(Integer)
    criteria: Mapped[list] = Column(JSON, default=list)
    feedback: Mapped[bool | None] = Column(Boolean, nullable=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)

    request: Mapped["Request"] = relationship(back_populates="matches")


class Proposal(Base):
    """Отклик исполнителя на запрос."""

    __tablename__ = "proposals"

    id: Mapped[int] = Column(Integer, primary_key=True)
    request_id: Mapped[int] = Column(Integer, ForeignKey("requests.id"), index=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), index=True)

    price: Mapped[int] = Column(Integer)
    term_days: Mapped[int] = Column(Integer)
    solution_text: Mapped[str] = Column(Text)
    case_ref: Mapped[str | None] = Column(Text, nullable=True)
    comment: Mapped[str | None] = Column(Text, nullable=True)

    status: Mapped[str] = Column(String(20), default="sent", index=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    viewed_at: Mapped[datetime | None] = Column(DateTime(timezone=True), nullable=True)

    request: Mapped["Request"] = relationship(back_populates="proposals")


class NotificationLog(Base):
    """Журнал уведомлений, отправленных через Bot API MAX."""

    __tablename__ = "notification_log"

    id: Mapped[int] = Column(Integer, primary_key=True)
    user_id: Mapped[int | None] = Column(Integer, nullable=True)
    target_user_id: Mapped[int | None] = Column(Integer, nullable=True, index=True)
    text: Mapped[str] = Column(Text)
    ok: Mapped[bool] = Column(Boolean, default=False)
    error: Mapped[str | None] = Column(Text, nullable=True)
    is_read: Mapped[bool] = Column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)


class Deal(Base):
    """Deal Room: зафиксированное начало переговоров по запросу."""

    __tablename__ = "deals"
    __table_args__ = (UniqueConstraint("proposal_id", name="uq_deal_proposal"),)

    id: Mapped[int] = Column(Integer, primary_key=True)
    opportunity_id: Mapped[int] = Column(Integer, ForeignKey("requests.id"), index=True)
    proposal_id: Mapped[int] = Column(Integer, ForeignKey("proposals.id"))
    customer_company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), index=True)
    executor_company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), index=True)
    status: Mapped[str] = Column(String(20), default="negotiating", index=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class UploadedFile(Base):
    """Файлы, загруженные пользователями (кейсы, вложения откликов и сделок)."""

    __tablename__ = "files"

    id: Mapped[int] = Column(Integer, primary_key=True)
    owner_user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), index=True)
    name: Mapped[str] = Column(String(255))
    content_type: Mapped[str | None] = Column(String(100), nullable=True)
    size: Mapped[int] = Column(Integer, default=0)
    storage_path: Mapped[str] = Column(String(500))
    # привязка к контексту: потребность и/или сделка (Deal Room)
    opportunity_id: Mapped[int | None] = Column(Integer, ForeignKey("requests.id"), nullable=True, index=True)
    deal_id: Mapped[int | None] = Column(Integer, ForeignKey("deals.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
