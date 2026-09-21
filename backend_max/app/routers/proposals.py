from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Company, Proposal, User
from ..notifications import notifier
from ..schemas import ProposalIn, ProposalOut, ProposalStatusIn, ShortlistIn
from ..services import (
    ensure_owns_request,
    get_proposal_or_404,
    get_request_or_404,
    proposal_out,
    require_company,
)

router = APIRouter(tags=["proposals"])

ALLOWED_STATUSES = {"shortlisted", "negotiating", "chosen", "rejected"}


def _create_proposal_impl(
    opportunity_id: int,
    payload: ProposalIn,
    user: User,
    db: Session,
) -> ProposalOut:
    """Отклик исполнителя. Профиль компании подставляется автоматически."""
    request = get_request_or_404(db, opportunity_id)
    if request.status != "published":
        raise HTTPException(status.HTTP_409_CONFLICT, "Приём предложений по запросу закрыт")
    executor = require_company(db, user)
    if request.company_id == executor.id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Нельзя откликнуться на собственный запрос")

    existing = (
        db.query(Proposal)
        .filter(Proposal.request_id == request.id, Proposal.company_id == executor.id)
        .first()
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Вы уже отправили предложение по этому запросу")

    proposal = Proposal(
        request_id=request.id,
        company_id=executor.id,
        price=payload.price,
        term_days=payload.term_days,
        solution_text=payload.solution_text,
        case_ref=payload.case_ref,
        comment=payload.comment,
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)

    owner = db.query(Company).filter(Company.id == request.company_id).first()
    if owner and owner.user_id:
        notifier.proposal_received(db.get(User, owner.user_id), request.title, executor.name)
    return proposal_out(proposal, db)


@router.post("/opportunities/{opportunity_id}/proposals", response_model=ProposalOut, status_code=status.HTTP_201_CREATED)
def create_proposal(
    opportunity_id: int,
    payload: ProposalIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProposalOut:
    return _create_proposal_impl(opportunity_id, payload, user, db)


@router.post(
    "/api/requests/{opportunity_id}/proposals",
    response_model=ProposalOut,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_proposal_legacy(
    opportunity_id: int,
    payload: ProposalIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProposalOut:
    return _create_proposal_impl(opportunity_id, payload, user, db)


@router.get("/opportunities/{opportunity_id}/proposals", response_model=list[ProposalOut])
def list_proposals(
    opportunity_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProposalOut]:
    """Список предложений по потребности (доступен автору)."""
    request = get_request_or_404(db, opportunity_id)
    company = require_company(db, user)
    ensure_owns_request(user, company, request)
    proposals = (
        db.query(Proposal).filter(Proposal.request_id == request.id).order_by(Proposal.created_at).all()
    )
    return [proposal_out(p, db) for p in proposals]


@router.get("/proposals/mine", response_model=list[ProposalOut])
def my_proposals(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProposalOut]:
    """«Мои отклики» исполнителя со статусами."""
    company = require_company(db, user)
    proposals = (
        db.query(Proposal)
        .filter(Proposal.company_id == company.id)
        .order_by(Proposal.created_at.desc())
        .all()
    )
    return [proposal_out(p, db) for p in proposals]


@router.get("/proposals/{proposal_id}", response_model=ProposalOut)
def get_proposal(
    proposal_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProposalOut:
    """Предложение доступно автору потребности и компании-исполнителю."""
    proposal = get_proposal_or_404(db, proposal_id)
    company = require_company(db, user)
    request = get_request_or_404(db, proposal.request_id)
    if proposal.company_id != company.id and request.company_id != company.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Предложение недоступно")
    return proposal_out(proposal, db)


def _toggle_shortlist_impl(proposal: Proposal, user: User, db: Session) -> ProposalOut:
    company = require_company(db, user)
    request = get_request_or_404(db, proposal.request_id)
    ensure_owns_request(user, company, request)
    if proposal.status in {"shortlisted", "negotiating"}:
        proposal.status = "viewed"
    else:
        proposal.status = "shortlisted"
        executor = db.get(Company, proposal.company_id)
        if executor and executor.user_id:
            notifier.added_to_shortlist(db.get(User, executor.user_id), request.title)
    db.commit()
    return proposal_out(proposal, db)


@router.post("/proposals/{proposal_id}/shortlist", response_model=ProposalOut)
def toggle_shortlist(
    proposal_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProposalOut:
    return _toggle_shortlist_impl(get_proposal_or_404(db, proposal_id), user, db)


@router.post("/opportunities/{opportunity_id}/shortlist", response_model=ProposalOut)
def shortlist_by_opportunity(
    opportunity_id: int,
    payload: ShortlistIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProposalOut:
    """Shortlist по потребности: укажите company_id или proposal_id."""
    request = get_request_or_404(db, opportunity_id)
    if payload.proposal_id is not None:
        proposal = get_proposal_or_404(db, payload.proposal_id)
        if proposal.request_id != request.id:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Предложение относится к другой потребности")
    elif payload.company_id is not None:
        proposal = (
            db.query(Proposal)
            .filter(Proposal.request_id == request.id, Proposal.company_id == payload.company_id)
            .first()
        )
        if proposal is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "У компании нет предложения по этой потребности")
    else:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Укажите company_id или proposal_id")
    return _toggle_shortlist_impl(proposal, user, db)


@router.post("/proposals/{proposal_id}/view", response_model=ProposalOut)
def mark_viewed(
    proposal_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProposalOut:
    proposal = get_proposal_or_404(db, proposal_id)
    company = require_company(db, user)
    request = get_request_or_404(db, proposal.request_id)
    ensure_owns_request(user, company, request)
    if proposal.viewed_at is None:
        proposal.viewed_at = datetime.now(timezone.utc)
        proposal.status = "viewed" if proposal.status == "sent" else proposal.status
        db.commit()
    return proposal_out(proposal, db)


@router.post("/proposals/{proposal_id}/status", response_model=ProposalOut)
def set_proposal_status(
    proposal_id: int,
    payload: ProposalStatusIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProposalOut:
    proposal = get_proposal_or_404(db, proposal_id)
    company = require_company(db, user)
    request = get_request_or_404(db, proposal.request_id)
    ensure_owns_request(user, company, request)

    new_status = payload.status
    if new_status not in ALLOWED_STATUSES:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            f"Допустимые статусы: {sorted(ALLOWED_STATUSES)}",
        )
    proposal.status = new_status
    if proposal.viewed_at is None:
        proposal.viewed_at = datetime.now(timezone.utc)
    db.commit()

    executor = db.get(Company, proposal.company_id)
    if executor and executor.user_id:
        executor_user = db.get(User, executor.user_id)
        if new_status == "chosen":
            notifier.chosen_as_executor(executor_user, request.title)
        elif new_status == "rejected":
            notifier.rejected(executor_user, request.title)
    return proposal_out(proposal, db)
