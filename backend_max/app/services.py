from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .matching import match_company
from .models import Company, CompanyMember, Proposal, Request, RequestMatch, User
from .notifications import notifier
from .schemas import (
    CriterionOut,
    MatchOut,
    ProposalOut,
    RequestDetailOut,
    RequestOut,
)

settings: Settings = get_settings()


def get_company_or_404(db: Session, company_id: int) -> Company:
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Компания не найдена")
    return company


def get_request_or_404(db: Session, request_id: int) -> Request:
    request = db.get(Request, request_id)
    if request is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Запрос не найден")
    return request


def get_proposal_or_404(db: Session, proposal_id: int) -> Proposal:
    proposal = db.get(Proposal, proposal_id)
    if proposal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Предложение не найдено")
    return proposal


def get_match_or_404(db: Session, match_id: int) -> RequestMatch:
    match = db.get(RequestMatch, match_id)
    if match is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Матч не найден")
    return match


def days_left(request: Request) -> int | None:
    if not request.expires_at:
        return None
    now = datetime.now(timezone.utc)
    if request.expires_at.tzinfo is None:
        request.expires_at = request.expires_at.replace(tzinfo=timezone.utc)
    return max(0, (request.expires_at - now).days)


def request_out(request: Request, db: Session) -> RequestOut:
    company = db.get(Company, request.company_id)
    proposals_count = (
        db.query(func.count(Proposal.id)).filter(Proposal.request_id == request.id).scalar() or 0
    )
    match_count = (
        db.query(func.count(RequestMatch.id)).filter(RequestMatch.request_id == request.id).scalar() or 0
    )
    return RequestOut(
        id=request.id,
        company_id=request.company_id,
        company_name=company.name if company else "",
        title=request.title,
        description_raw=request.description_raw,
        category=request.category,
        subcategory=request.subcategory,
        requirements=request.requirements or [],
        required_certificates=request.required_certificates or [],
        budget_min=request.budget_min,
        budget_max=request.budget_max,
        deadline_days=request.deadline_days,
        regions=request.regions or [],
        proposals_deadline_days=request.proposals_deadline_days,
        status=request.status,
        created_at=request.created_at,
        published_at=request.published_at,
        expires_at=request.expires_at,
        proposals_count=proposals_count,
        match_count=match_count,
        days_left=days_left(request) if request.status == "published" else None,
    )


def proposal_out(proposal: Proposal, db: Session) -> ProposalOut:
    request = db.get(Request, proposal.request_id)
    company = db.get(Company, proposal.company_id)
    return ProposalOut(
        id=proposal.id,
        request_id=proposal.request_id,
        request_title=request.title if request else "",
        company_id=proposal.company_id,
        company_name=company.name if company else "",
        price=proposal.price,
        term_days=proposal.term_days,
        solution_text=proposal.solution_text,
        case_ref=proposal.case_ref,
        comment=proposal.comment,
        status=proposal.status,
        created_at=proposal.created_at,
        viewed_at=proposal.viewed_at,
    )


def criteria_out(criteria: list[dict]) -> list[CriterionOut]:
    return [CriterionOut(**c) for c in criteria]


def match_out(request_match: RequestMatch, db: Session) -> MatchOut:
    company = db.get(Company, request_match.company_id)
    return MatchOut(
        id=request_match.id,
        company_id=request_match.company_id,
        company_name=company.name if company else "",
        score=request_match.score,
        criteria=criteria_out(request_match.criteria or []),
        feedback=request_match.feedback,
    )


def recompute_matches(db: Session, request: Request, notify: bool = True) -> list[MatchOut]:
    companies = db.query(Company).filter(Company.id != request.company_id).all()
    db.query(RequestMatch).filter(RequestMatch.request_id == request.id).delete()

    results: list[RequestMatch] = []
    for company in companies:
        score, criteria = match_company(request, company)
        if score < settings.min_match_score:
            continue
        match = RequestMatch(
            request_id=request.id,
            company_id=company.id,
            score=score,
            criteria=[c.as_dict() for c in criteria],
        )
        db.add(match)
        results.append(match)

    db.commit()

    results.sort(key=lambda m: m.score, reverse=True)
    top = results[: settings.top_matches]
    if notify:
        for match in top:
            executor_user_id = db.get(Company, match.company_id).user_id
            user = db.get(User, executor_user_id) if executor_user_id else None
            notifier.new_request_match(user, request.title, match.score)
    return [match_out(m, db) for m in top]


def request_detail_out(request: Request, db: Session) -> RequestDetailOut:
    base = request_out(request, db)
    matches = (
        db.query(RequestMatch)
        .filter(RequestMatch.request_id == request.id)
        .order_by(RequestMatch.score.desc())
        .limit(settings.top_matches)
        .all()
    )
    proposals = (
        db.query(Proposal).filter(Proposal.request_id == request.id).order_by(Proposal.created_at).all()
    )
    return RequestDetailOut(
        **base.model_dump(),
        matches=[match_out(m, db) for m in matches],
        proposals=[proposal_out(p, db) for p in proposals],
    )


def publish_request(db: Session, request: Request) -> None:
    request.status = "published"
    request.published_at = datetime.now(timezone.utc)
    request.expires_at = request.published_at + timedelta(days=request.proposals_deadline_days)
    db.commit()
    enqueue_moderation_for_request(db, request)


def enqueue_moderation_for_request(db: Session, request: Request) -> None:
    from .models import ModerationItem

    entity_id = str(request.id)
    existing = (
        db.query(ModerationItem)
        .filter(
            ModerationItem.entity_type == "opportunity",
            ModerationItem.entity_id == entity_id,
            ModerationItem.status.in_(["PENDING", "IN_REVIEW", "NEEDS_CHANGES", "ESCALATED"]),
        )
        .first()
    )
    if existing is not None:
        return

    company = get_company_or_404(db, request.company_id)
    owner = db.get(User, company.user_id)
    owner_name = ""
    if owner is not None:
        owner_name = f"{owner.first_name or ''} {owner.last_name or ''}".strip() or str(owner.id)

    db.add(
        ModerationItem(
            entity_type="opportunity",
            entity_id=entity_id,
            title=request.title,
            owner_id=str(owner.id) if owner else None,
            owner_name=owner_name or None,
            company_name=company.name,
            status="PENDING",
            priority="NORMAL",
            reason="NEW_OPPORTUNITY",
            summary=(request.description_raw or "")[:500] or None,
            payload={
                "category": request.category,
                "subcategory": request.subcategory,
                "budget_min": request.budget_min,
                "budget_max": request.budget_max,
                "regions": request.regions or [],
            },
            checklist=[
                "Корректность категории",
                "Бюджет и сроки адекватны",
                "Нет запрещённого контента",
            ],
            data_origin="USER",
        )
    )
    db.commit()


def enqueue_moderation_item(
    db: Session,
    *,
    entity_type: str,
    entity_id: str,
    title: str,
    company_name: str | None = None,
    owner_id: str | None = None,
    owner_name: str | None = None,
    reason: str = "NEW_CONTENT",
    summary: str | None = None,
    payload: dict | None = None,
    priority: str = "NORMAL",
    status: str = "PENDING",
) -> None:
    from .models import ModerationItem

    db.add(
        ModerationItem(
            entity_type=entity_type,
            entity_id=entity_id,
            title=title,
            owner_id=owner_id,
            owner_name=owner_name,
            company_name=company_name,
            status=status,
            priority=priority,
            reason=reason,
            summary=summary,
            payload=payload or {},
            data_origin="USER",
        )
    )
    db.commit()


def get_company_for_user(db: Session, user: User) -> Company | None:
    from .models import CompanyMember
    from .roles import MEMBER_STATUS_ACTIVE

    # Prefer active membership (Manager/Viewer on DigitalLab over any owned shell)
    membership = (
        db.query(CompanyMember)
        .filter(CompanyMember.user_id == user.id, CompanyMember.status == MEMBER_STATUS_ACTIVE)
        .first()
    )
    if membership is not None:
        company = db.get(Company, membership.company_id)
        if company is not None:
            return company
    owned = db.query(Company).filter(Company.user_id == user.id).first()
    if owned is not None:
        return owned
    return None


def require_company(db: Session, user: User) -> Company:
    company = get_company_for_user(db, user)
    if company is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "Сначала создайте профиль компании: PUT /companies/me",
        )
    return company


def ensure_owns_request(user: User, company: Company, request: Request) -> None:
    if request.company_id != company.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Запрос принадлежит другой компании")


def ensure_owner_member(db: Session, company: Company, user: User) -> None:
    """Ensure owner row exists in company_members for COMPANY_ADMIN owners only.

    BUSINESS_USER owners (e.g. WebForge) stay marketplace-only — no ADMIN membership.
    """
    from .models import CompanyMember, utcnow
    from .roles import MEMBER_ROLE_ADMIN, MEMBER_STATUS_ACTIVE, ROLE_COMPANY_ADMIN

    if user.role != ROLE_COMPANY_ADMIN:
        return

    existing = (
        db.query(CompanyMember)
        .filter(CompanyMember.company_id == company.id, CompanyMember.user_id == user.id)
        .first()
    )
    if existing:
        if existing.member_role != MEMBER_ROLE_ADMIN or existing.status != MEMBER_STATUS_ACTIVE:
            existing.member_role = MEMBER_ROLE_ADMIN
            existing.status = MEMBER_STATUS_ACTIVE
            if existing.joined_at is None:
                existing.joined_at = utcnow()
            db.commit()
        return
    email = user.email or f"user{user.max_user_id}@b2b.local"
    db.add(
        CompanyMember(
            company_id=company.id,
            user_id=user.id,
            first_name=user.first_name or "",
            last_name=user.last_name or "",
            email=email,
            member_role=MEMBER_ROLE_ADMIN,
            status=MEMBER_STATUS_ACTIVE,
            joined_at=utcnow(),
        )
    )
    db.commit()


def append_activity(
    db: Session,
    company_id: int,
    type_: str,
    actor_name: str,
    action: str,
    entity_label: str | None = None,
) -> None:
    from .models import CompanyActivityEvent

    db.add(
        CompanyActivityEvent(
            company_id=company_id,
            type=type_,
            actor_name=actor_name,
            action=action,
            entity_label=entity_label,
        )
    )
    db.commit()


def append_audit(
    db: Session,
    *,
    actor: User,
    action: str,
    entity_type: str = "",
    entity_id: str = "",
    entity_name: str = "",
    reason: str | None = None,
    before: dict | None = None,
    after: dict | None = None,
) -> None:
    from .models import AuditEvent

    db.add(
        AuditEvent(
            actor_id=str(actor.id),
            actor_name=f"{actor.first_name or ''} {actor.last_name or ''}".strip() or str(actor.id),
            actor_role=getattr(actor, "role", "") or ("PLATFORM_ADMIN" if actor.is_admin else ""),
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            reason=reason,
            before=before,
            after=after,
        )
    )
    db.commit()
