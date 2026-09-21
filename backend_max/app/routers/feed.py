from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..config import Settings, get_settings
from ..db import get_db
from ..deps import get_current_user
from ..models import Proposal, Request, RequestMatch, User
from ..schemas import DashboardOut, FeedItemOut, MatchOut, FeedbackIn
from ..services import (
    get_match_or_404,
    get_request_or_404,
    match_out,
    proposal_out,
    request_out,
    require_company,
)

router = APIRouter(tags=["feed"])

settings: Settings = get_settings()


@router.get("/me/recommendations", response_model=list[FeedItemOut])
def personal_recommendations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[FeedItemOut]:
    """Персональная лента релевантных заказов исполнителя (двусторонний матчинг)."""
    company = require_company(db, user)
    matches = (
        db.query(RequestMatch)
        .join(Request, RequestMatch.request_id == Request.id)
        .filter(RequestMatch.company_id == company.id, Request.status == "published")
        .order_by(RequestMatch.score.desc())
        .all()
    )
    return [
        FeedItemOut(
            match_id=m.id,
            request=request_out(db.get(Request, m.request_id), db),
            score=m.score,
            criteria=list(m.criteria or []),
            feedback=m.feedback,
        )
        for m in matches
    ]


@router.post("/matches/{match_id}/feedback", response_model=MatchOut)
def match_feedback(
    match_id: int,
    payload: FeedbackIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MatchOut:
    """Обратная связь по рекомендации: релевантен ли матч.

    Доступно исполнителю (компании из матча) и автору потребности.
    Используется для обучения/настройки рекомендаций.
    """
    match = get_match_or_404(db, match_id)
    company = require_company(db, user)
    request = get_request_or_404(db, match.request_id)
    if match.company_id != company.id and request.company_id != company.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Матч недоступен")
    match.feedback = payload.positive
    db.commit()
    return match_out(match, db)


@router.get("/feed", response_model=DashboardOut)
def dashboard(
    mode: str = Query(default="executor", pattern="^(executor|customer)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardOut:
    """Единый dashboard мини-приложения.

    mode=executor — персональная лента релевантных заказов,
    mode=customer — мои запросы, новые предложения и рекомендованные компании.
    """
    company = require_company(db, user)

    if mode == "executor":
        matches = (
            db.query(RequestMatch)
            .join(Request, RequestMatch.request_id == Request.id)
            .filter(RequestMatch.company_id == company.id, Request.status == "published")
            .order_by(RequestMatch.score.desc())
            .all()
        )
        feed = [
            FeedItemOut(
                match_id=m.id,
                request=request_out(db.get(Request, m.request_id), db),
                score=m.score,
                criteria=list(m.criteria or []),
                feedback=m.feedback,
            )
            for m in matches
        ]
        return DashboardOut(mode=mode, feed=feed)

    my_requests = (
        db.query(Request)
        .filter(Request.company_id == company.id)
        .order_by(Request.created_at.desc())
        .all()
    )
    my_request_ids = [r.id for r in my_requests]
    recent_proposals = (
        db.query(Proposal)
        .filter(Proposal.request_id.in_(my_request_ids))
        .order_by(Proposal.created_at.desc())
        .limit(20)
        .all()
    ) if my_request_ids else []

    top_matches = (
        db.query(RequestMatch)
        .filter(RequestMatch.request_id.in_(my_request_ids))
        .order_by(RequestMatch.score.desc())
        .limit(settings.top_matches)
        .all()
    ) if my_request_ids else []

    return DashboardOut(
        mode=mode,
        my_requests=[request_out(r, db) for r in my_requests],
        recent_proposals=[proposal_out(p, db) for p in recent_proposals],
        top_companies=[match_out(m, db) for m in top_matches],
    )
