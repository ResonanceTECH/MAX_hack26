from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .matching import match_company
from .models import Company, Proposal, Request, RequestMatch, User
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
    """Пересчитывает матчи запроса со всеми компаниями (кроме автора).

    Возвращает топ рекомендаций для заказчика и параллельно создаёт
    записи, из которых исполнители видят запрос в своей ленте.
    """
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


def get_company_for_user(db: Session, user: User) -> Company | None:
    return db.query(Company).filter(Company.user_id == user.id).first()


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
