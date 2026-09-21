from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Company, Deal, Proposal, UploadedFile, User
from ..notifications import notifier
from ..schemas import DealCreateIn, DealOut, FileOut
from ..services import (
    ensure_owns_request,
    get_proposal_or_404,
    get_request_or_404,
    proposal_out,
    require_company,
)

router = APIRouter(prefix="/deals", tags=["deals"])


def _deal_files(deal: Deal, db: Session) -> list[FileOut]:
    files = (
        db.query(UploadedFile)
        .filter(
            (UploadedFile.deal_id == deal.id)
            | (UploadedFile.opportunity_id == deal.opportunity_id)
        )
        .all()
    )
    return [FileOut.model_validate(f) for f in files]


def _deal_out(deal: Deal, db: Session) -> DealOut:
    request = get_request_or_404(db, deal.opportunity_id)
    proposal = db.get(Proposal, deal.proposal_id)
    return DealOut(
        id=deal.id,
        opportunity_id=deal.opportunity_id,
        proposal_id=deal.proposal_id,
        customer_company_id=deal.customer_company_id,
        executor_company_id=deal.executor_company_id,
        status=deal.status,
        created_at=deal.created_at,
        updated_at=deal.updated_at,
        opportunity_title=request.title,
        proposal=proposal_out(proposal, db) if proposal else None,
        files=_deal_files(deal, db),
        next_action="Переговоры начаты — согласуйте условия и зафиксируйте договорённости",
    )


@router.post("", response_model=DealOut, status_code=status.HTTP_201_CREATED)
def create_deal(
    payload: DealCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DealOut:
    """Открывает Deal Room: фиксирует переход в переговоры с исполнителем."""
    request = get_request_or_404(db, payload.opportunity_id)
    company = require_company(db, user)
    ensure_owns_request(user, company, request)

    proposal = get_proposal_or_404(db, payload.proposal_id)
    if proposal.request_id != request.id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Предложение относится к другой потребности")
    if proposal.status == "rejected":
        raise HTTPException(status.HTTP_409_CONFLICT, "Предложение отклонено")

    existing = db.query(Deal).filter(Deal.proposal_id == proposal.id).first()
    if existing:
        return _deal_out(existing, db)

    deal = Deal(
        opportunity_id=request.id,
        proposal_id=proposal.id,
        customer_company_id=request.company_id,
        executor_company_id=proposal.company_id,
        status="negotiating",
    )
    proposal.status = "negotiating"
    db.add(deal)
    db.commit()
    db.refresh(deal)

    executor = db.get(Company, proposal.company_id)
    if executor and executor.user_id:
        notifier.negotiation_started(db.get(User, executor.user_id), request.title)
    return _deal_out(deal, db)


@router.get("", response_model=list[DealOut])
def my_deals(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DealOut]:
    """Все сделки моей компании (как заказчик и как исполнитель)."""
    company = require_company(db, user)
    deals = (
        db.query(Deal)
        .filter(
            (Deal.customer_company_id == company.id) | (Deal.executor_company_id == company.id)
        )
        .order_by(Deal.updated_at.desc())
        .all()
    )
    return [_deal_out(d, db) for d in deals]


@router.get("/{deal_id}", response_model=DealOut)
def get_deal(
    deal_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DealOut:
    deal = db.get(Deal, deal_id)
    if deal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сделка не найдена")
    company = require_company(db, user)
    if deal.customer_company_id != company.id and deal.executor_company_id != company.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Сделка недоступна")
    return _deal_out(deal, db)
