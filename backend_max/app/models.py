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
    email: Mapped[str | None] = Column(String(255), nullable=True)
    # BUSINESS_USER | COMPANY_ADMIN | MODERATOR | PLATFORM_ADMIN
    role: Mapped[str] = Column(String(32), default="BUSINESS_USER", index=True)
    # legacy flag — kept in sync with role == PLATFORM_ADMIN
    is_admin: Mapped[bool] = Column(Boolean, default=False)
    status: Mapped[str] = Column(String(20), default="active", index=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    last_active_at: Mapped[datetime | None] = Column(DateTime(timezone=True), nullable=True)

    company: Mapped["Company | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    memberships: Mapped[list["CompanyMember"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="CompanyMember.user_id",
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
    # ACTIVE | SUSPENDED | BLOCKED | ARCHIVED
    platform_status: Mapped[str] = Column(String(20), default="ACTIVE", index=True)
    # NOT_VERIFIED | PENDING | VERIFIED | REJECTED | REQUIRES_UPDATE
    verification_status: Mapped[str] = Column(String(32), default="NOT_VERIFIED", index=True)
    settings_json: Mapped[dict] = Column(JSON, default=dict)

    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    user: Mapped["User"] = relationship(back_populates="company")
    members: Mapped[list["CompanyMember"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )


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


class CompanyMember(Base):
    """Team membership — company-scoped role separate from platform User.role."""

    __tablename__ = "company_members"
    __table_args__ = (UniqueConstraint("company_id", "email", name="uq_company_member_email"),)

    id: Mapped[int] = Column(Integer, primary_key=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), index=True)
    user_id: Mapped[int | None] = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    first_name: Mapped[str] = Column(String(255), default="")
    last_name: Mapped[str] = Column(String(255), default="")
    email: Mapped[str] = Column(String(255))
    # COMPANY_ADMIN | MANAGER | VIEWER
    member_role: Mapped[str] = Column(String(32), default="MANAGER")
    # active | invited | suspended | deactivated | declined
    status: Mapped[str] = Column(String(20), default="invited", index=True)
    invited_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    joined_at: Mapped[datetime | None] = Column(DateTime(timezone=True), nullable=True)
    last_active_at: Mapped[datetime | None] = Column(DateTime(timezone=True), nullable=True)
    invite_token: Mapped[str | None] = Column(String(64), nullable=True, unique=True, index=True)
    invited_by_user_id: Mapped[int | None] = Column(Integer, ForeignKey("users.id"), nullable=True)
    expires_at: Mapped[datetime | None] = Column(DateTime(timezone=True), nullable=True)
    message: Mapped[str | None] = Column(Text, nullable=True)

    company: Mapped["Company"] = relationship(back_populates="members")
    user: Mapped["User | None"] = relationship(
        back_populates="memberships",
        foreign_keys=[user_id],
    )


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "target_type", "target_id", name="uq_favorite_target"),
    )

    id: Mapped[int] = Column(Integer, primary_key=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), index=True)
    # company | opportunity
    target_type: Mapped[str] = Column(String(32))
    target_id: Mapped[int] = Column(Integer)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)


class OpportunityInvite(Base):
    __tablename__ = "opportunity_invites"
    __table_args__ = (
        UniqueConstraint("opportunity_id", "company_id", name="uq_opportunity_invite"),
    )

    id: Mapped[int] = Column(Integer, primary_key=True)
    opportunity_id: Mapped[int] = Column(Integer, ForeignKey("requests.id"), index=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), index=True)
    invited_by_user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"))
    # PENDING | ACCEPTED | DECLINED | EXPIRED
    status: Mapped[str] = Column(String(20), default="PENDING", index=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    responded_at: Mapped[datetime | None] = Column(DateTime(timezone=True), nullable=True)


class CompanyServiceItem(Base):
    __tablename__ = "company_services"

    id: Mapped[int] = Column(Integer, primary_key=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), index=True)
    title: Mapped[str] = Column(String(500))
    description: Mapped[str] = Column(Text, default="")
    category: Mapped[str] = Column(String(255), default="")
    status: Mapped[str] = Column(String(20), default="draft", index=True)
    short_description: Mapped[str | None] = Column(Text, nullable=True)
    price_min: Mapped[int | None] = Column(Integer, nullable=True)
    price_max: Mapped[int | None] = Column(Integer, nullable=True)
    currency: Mapped[str] = Column(String(8), default="RUB")
    regions: Mapped[list] = Column(JSON, default=list)
    remote: Mapped[bool] = Column(Boolean, default=False)
    technologies: Mapped[list] = Column(JSON, default=list)
    capabilities: Mapped[list] = Column(JSON, default=list)
    target_industries: Mapped[list] = Column(JSON, default=list)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class CompanyCaseItem(Base):
    __tablename__ = "company_cases"

    id: Mapped[int] = Column(Integer, primary_key=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), index=True)
    title: Mapped[str] = Column(String(500))
    industry: Mapped[str] = Column(String(255), default="")
    description: Mapped[str] = Column(Text, default="")
    result: Mapped[str] = Column(Text, default="")
    technologies: Mapped[list] = Column(JSON, default=list)
    status: Mapped[str] = Column(String(20), default="draft", index=True)
    client_name: Mapped[str | None] = Column(String(255), nullable=True)
    client_visible: Mapped[bool] = Column(Boolean, default=False)
    solution: Mapped[str | None] = Column(Text, nullable=True)
    start_date: Mapped[str | None] = Column(String(32), nullable=True)
    end_date: Mapped[str | None] = Column(String(32), nullable=True)
    cover_url: Mapped[str | None] = Column(String(500), nullable=True)
    external_url: Mapped[str | None] = Column(String(500), nullable=True)
    capabilities: Mapped[list] = Column(JSON, default=list)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class CompanyDocumentItem(Base):
    __tablename__ = "company_documents"

    id: Mapped[int] = Column(Integer, primary_key=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), index=True)
    name: Mapped[str] = Column(String(500))
    doc_type: Mapped[str] = Column(String(100), default="")
    file_name: Mapped[str] = Column(String(500), default="")
    status: Mapped[str] = Column(String(32), default="Pending", index=True)
    number: Mapped[str | None] = Column(String(100), nullable=True)
    issuer: Mapped[str | None] = Column(String(255), nullable=True)
    issued_at: Mapped[str | None] = Column(String(32), nullable=True)
    expires_at: Mapped[str | None] = Column(String(32), nullable=True)
    file_url: Mapped[str | None] = Column(String(500), nullable=True)
    file_id: Mapped[int | None] = Column(Integer, ForeignKey("files.id"), nullable=True)
    verification_source: Mapped[str] = Column(String(64), default="COMPANY_DATA")
    uploaded_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class CompanyActivityEvent(Base):
    __tablename__ = "company_activity"

    id: Mapped[int] = Column(Integer, primary_key=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), index=True)
    type: Mapped[str] = Column(String(64))
    actor_name: Mapped[str] = Column(String(255), default="")
    action: Mapped[str] = Column(String(500), default="")
    entity_label: Mapped[str | None] = Column(String(500), nullable=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)


class ModerationItem(Base):
    __tablename__ = "moderation_items"

    id: Mapped[int] = Column(Integer, primary_key=True)
    entity_type: Mapped[str] = Column(String(32), index=True)
    entity_id: Mapped[str] = Column(String(64), index=True)
    title: Mapped[str] = Column(String(500), default="")
    owner_id: Mapped[str | None] = Column(String(64), nullable=True)
    owner_name: Mapped[str | None] = Column(String(255), nullable=True)
    company_name: Mapped[str | None] = Column(String(255), nullable=True)
    status: Mapped[str] = Column(String(32), default="PENDING", index=True)
    priority: Mapped[str] = Column(String(16), default="NORMAL")
    reason: Mapped[str] = Column(String(64), default="NEW_OPPORTUNITY")
    summary: Mapped[str | None] = Column(Text, nullable=True)
    payload: Mapped[dict] = Column(JSON, default=dict)
    checklist: Mapped[list] = Column(JSON, default=list)
    related_report_ids: Mapped[list] = Column(JSON, default=list)
    automated_flags: Mapped[list] = Column(JSON, default=list)
    data_origin: Mapped[str] = Column(String(64), default="USER")
    moderator_note: Mapped[str | None] = Column(Text, nullable=True)
    assigned_moderator_id: Mapped[int | None] = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_moderator_name: Mapped[str | None] = Column(String(255), nullable=True)
    reports_count: Mapped[int] = Column(Integer, default=0)
    version: Mapped[int] = Column(Integer, default=1)
    submitted_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = Column(Integer, primary_key=True)
    reporter_id: Mapped[int | None] = Column(Integer, ForeignKey("users.id"), nullable=True)
    reporter_name: Mapped[str] = Column(String(255), default="")
    target_type: Mapped[str] = Column(String(32))
    target_id: Mapped[str] = Column(String(64))
    target_name: Mapped[str] = Column(String(500), default="")
    report_type: Mapped[str] = Column(String(64), default="OTHER")
    description: Mapped[str] = Column(Text, default="")
    status: Mapped[str] = Column(String(32), default="OPEN", index=True)
    priority: Mapped[str] = Column(String(16), default="NORMAL")
    assigned_moderator_id: Mapped[int | None] = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution: Mapped[str | None] = Column(Text, nullable=True)
    resolution_code: Mapped[str | None] = Column(String(64), nullable=True)
    resolved_by: Mapped[str | None] = Column(String(255), nullable=True)
    resolved_at: Mapped[datetime | None] = Column(DateTime(timezone=True), nullable=True)
    related_report_ids: Mapped[list] = Column(JSON, default=list)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)


class Escalation(Base):
    __tablename__ = "escalations"

    id: Mapped[int] = Column(Integer, primary_key=True)
    moderation_item_id: Mapped[int | None] = Column(Integer, ForeignKey("moderation_items.id"), nullable=True)
    report_id: Mapped[int | None] = Column(Integer, ForeignKey("reports.id"), nullable=True)
    title: Mapped[str] = Column(String(500), default="")
    reason: Mapped[str] = Column(Text, default="")
    status: Mapped[str] = Column(String(32), default="OPEN", index=True)
    created_by_id: Mapped[int | None] = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    resolved_at: Mapped[datetime | None] = Column(DateTime(timezone=True), nullable=True)
    resolution: Mapped[str | None] = Column(Text, nullable=True)
    admin_response: Mapped[str | None] = Column(Text, nullable=True)


class ModerationDecision(Base):
    __tablename__ = "moderation_decisions"

    id: Mapped[int] = Column(Integer, primary_key=True)
    item_id: Mapped[int] = Column(Integer, ForeignKey("moderation_items.id"), index=True)
    moderator_id: Mapped[int | None] = Column(Integer, ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = Column(String(32))  # APPROVED | REJECTED | BLOCKED | NEEDS_CHANGES
    reason: Mapped[str | None] = Column(Text, nullable=True)
    comment: Mapped[str | None] = Column(Text, nullable=True)
    previous_status: Mapped[str] = Column(String(32), default="")
    new_status: Mapped[str] = Column(String(32), default="")
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = Column(Integer, primary_key=True)
    actor_id: Mapped[str | None] = Column(String(64), nullable=True)
    actor_name: Mapped[str] = Column(String(255), default="")
    actor_role: Mapped[str] = Column(String(64), default="")
    action: Mapped[str] = Column(String(128))
    entity_type: Mapped[str] = Column(String(64), default="")
    entity_id: Mapped[str] = Column(String(64), default="")
    entity_name: Mapped[str] = Column(String(500), default="")
    reason: Mapped[str | None] = Column(Text, nullable=True)
    before: Mapped[dict | None] = Column(JSON, nullable=True)
    after: Mapped[dict | None] = Column(JSON, nullable=True)
    details: Mapped[dict | None] = Column(JSON, nullable=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id: Mapped[int] = Column(Integer, primary_key=True)
    key: Mapped[str] = Column(String(128), unique=True, index=True)
    name: Mapped[str] = Column(String(255), default="")
    description: Mapped[str] = Column(Text, default="")
    enabled: Mapped[bool] = Column(Boolean, default=False)
    scope: Mapped[str] = Column(String(32), default="GLOBAL")
    updated_by: Mapped[str | None] = Column(String(255), nullable=True)
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class PlatformSettings(Base):
    __tablename__ = "platform_settings"

    id: Mapped[int] = Column(Integer, primary_key=True)
    general: Mapped[dict] = Column(JSON, default=dict)
    moderation: Mapped[dict] = Column(JSON, default=dict)
    matching: Mapped[dict] = Column(JSON, default=dict)
    notifications: Mapped[dict] = Column(JSON, default=dict)
    maintenance: Mapped[dict] = Column(JSON, default=dict)
    announcement: Mapped[dict] = Column(JSON, default=dict)
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class DictionaryItem(Base):
    __tablename__ = "dictionary_items"

    id: Mapped[int] = Column(Integer, primary_key=True)
    type: Mapped[str] = Column(String(64), index=True)
    name: Mapped[str] = Column(String(255))
    slug: Mapped[str] = Column(String(255), index=True)
    parent_id: Mapped[int | None] = Column(Integer, ForeignKey("dictionary_items.id"), nullable=True)
    aliases: Mapped[list] = Column(JSON, default=list)
    status: Mapped[str] = Column(String(20), default="active", index=True)
    sort_order: Mapped[int] = Column(Integer, default=0)
    category: Mapped[str | None] = Column(String(255), nullable=True)
    description: Mapped[str | None] = Column(Text, nullable=True)
    usage_count: Mapped[int] = Column(Integer, default=0)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
