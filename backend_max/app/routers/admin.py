from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import require_admin
from ..models import Company, NotificationLog, Proposal, Request, RequestMatch, User
from ..notifications import notifier
from ..schemas import (
    CompanyOut,
    ModerateIn,
    NotificationLogOut,
    RequestOut,
    StatsOut,
    VerifyIn,
)
from ..services import request_out

router = APIRouter(prefix="/admin", tags=["admin"])


def compute_stats(db: Session) -> StatsOut:
    return StatsOut(
        users=db.query(func.count(User.id)).scalar() or 0,
        companies=db.query(func.count(Company.id)).scalar() or 0,
        requests=db.query(func.count(Request.id)).scalar() or 0,
        published_requests=db.query(func.count(Request.id)).filter(Request.status == "published").scalar() or 0,
        proposals=db.query(func.count(Proposal.id)).scalar() or 0,
        matches=db.query(func.count(RequestMatch.id)).scalar() or 0,
        notifications=db.query(func.count(NotificationLog.id)).scalar() or 0,
    )


@router.post("/seed", response_model=StatsOut)
def seed_demo_data(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> StatsOut:
    from ..seed import seed_demo

    seed_demo(db)
    return compute_stats(db)


@router.post("/reset", response_model=dict)
def reset_data(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    from ..models import (
        AuditEvent,
        CompanyActivityEvent,
        CompanyCaseItem,
        CompanyDocumentItem,
        CompanyMember,
        CompanyServiceItem,
        Deal,
        DictionaryItem,
        Escalation,
        FeatureFlag,
        Favorite,
        ModerationDecision,
        ModerationItem,
        NotificationLog,
        OpportunityInvite,
        PlatformSettings,
        Proposal,
        Report,
        RequestMatch,
        UploadedFile,
    )

    for model in (
        NotificationLog,
        AuditEvent,
        CompanyActivityEvent,
        ModerationDecision,
        Escalation,
        Report,
        ModerationItem,
        OpportunityInvite,
        CompanyMember,
        CompanyDocumentItem,
        CompanyCaseItem,
        CompanyServiceItem,
        Favorite,
        Deal,
        Proposal,
        RequestMatch,
        Request,
        UploadedFile,
        DictionaryItem,
        FeatureFlag,
        PlatformSettings,
        Company,
        User,
    ):
        db.query(model).delete()
    db.commit()
    return {"reset": True}


@router.get("/stats", response_model=StatsOut)
def stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> StatsOut:
    return compute_stats(db)


@router.post("/companies/{company_id}/verify", response_model=CompanyOut)
def verify_company(
    company_id: int,
    payload: VerifyIn,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CompanyOut:
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Компания не найдена")
    company.is_verified = payload.verified
    db.commit()
    return CompanyOut.model_validate(company)


@router.post("/requests/{request_id}/moderate", response_model=RequestOut)
def moderate_request(
    request_id: int,
    payload: ModerateIn,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> RequestOut:
    request = db.get(Request, request_id)
    if request is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Запрос не найден")
    actions = {"publish", "block", "close", "reopen"}
    if payload.action not in actions:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Действие: {sorted(actions)}")
    if payload.action == "block":
        request.status = "blocked"
    elif payload.action == "close":
        request.status = "closed"
    elif payload.action == "reopen":
        request.status = "published"
    elif payload.action == "publish":
        request.status = "published"
        request.published_at = request.published_at or datetime.now(timezone.utc)
        request.expires_at = datetime.now(timezone.utc) + timedelta(days=request.proposals_deadline_days)
    db.commit()
    return request_out(request, db)


@router.post("/notify/deadlines", response_model=dict)
def notify_deadlines(
    days: int = 2,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Напоминания: «до окончания приёма предложений осталось N дней»."""
    requests = db.query(Request).filter(Request.status == "published").all()
    sent = 0
    now = datetime.now(timezone.utc)
    for request in requests:
        if not request.expires_at:
            continue
        expires = request.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        days_left = (expires - now).days
        if days_left > days or days_left < 0:
            continue
        for match in request.matches:
            company = db.get(Company, match.company_id)
            if company and company.user_id:
                user = db.get(User, company.user_id)
                notifier.deadline_reminder(user, request.title, days_left)
                sent += 1
        author = db.get(Company, request.company_id)
        if author and author.user_id:
            user = db.get(User, author.user_id)
            notifier.deadline_reminder(user, request.title, days_left)
            sent += 1
    return {"sent": sent}


@router.get("/notifications", response_model=list[NotificationLogOut])
def list_notifications(
    limit: int = 50,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[NotificationLogOut]:
    logs = db.query(NotificationLog).order_by(NotificationLog.created_at.desc()).limit(limit).all()
    return [NotificationLogOut.model_validate(l) for l in logs]
