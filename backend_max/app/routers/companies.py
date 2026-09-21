from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Company, Proposal, Request, User
from ..schemas import CompanyIn, CompanyOut, CompanyPatchIn, CompanyStatsOut
from ..services import get_company_for_user, get_company_or_404, require_company

router = APIRouter(tags=["companies"])


@router.get("/companies", response_model=list[CompanyOut])
def list_companies(
    q: str | None = Query(default=None, description="Поиск по названию/описанию"),
    category: str | None = None,
    region: str | None = None,
    verified_only: bool = False,
    limit: int = Query(default=50, le=100),
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[CompanyOut]:
    """Каталог компаний (витрина исполнителей)."""
    query = db.query(Company)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Company.name.ilike(like), Company.description.ilike(like)))
    if verified_only:
        query = query.filter(Company.is_verified.is_(True))
    companies = query.offset(offset).limit(limit).all()

    if category:
        companies = [c for c in companies if category in (c.industries or [])]
    if region:
        companies = [c for c in companies if region in (c.regions or []) or "Вся Россия" in (c.regions or [])]
    return [CompanyOut.model_validate(c) for c in companies]


@router.get("/companies/me", response_model=CompanyOut)
def get_my_company(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompanyOut:
    company = require_company(db, user)
    return CompanyOut.model_validate(company)


@router.put("/companies/me", response_model=CompanyOut)
def upsert_my_company(
    payload: CompanyIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompanyOut:
    """Создаёт или обновляет профиль своей компании."""
    company = get_company_for_user(db, user)
    data = payload.model_dump(exclude_unset=True)
    if company is None:
        company = Company(user_id=user.id, **data)
        db.add(company)
    else:
        for key, value in data.items():
            setattr(company, key, value)
    db.commit()
    db.refresh(company)
    return CompanyOut.model_validate(company)


@router.get("/companies/{company_id}", response_model=CompanyStatsOut)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
) -> CompanyStatsOut:
    company = get_company_or_404(db, company_id)
    active_requests = (
        db.query(Request).filter(Request.company_id == company.id, Request.status == "published").count()
    )
    proposals_count = db.query(Proposal).filter(Proposal.company_id == company.id).count()
    out = CompanyStatsOut.model_validate(company)
    out.active_requests = active_requests
    out.proposals_count = proposals_count
    return out


@router.patch("/companies/{company_id}", response_model=CompanyOut)
def patch_company(
    company_id: int,
    payload: CompanyPatchIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompanyOut:
    company = get_company_or_404(db, company_id)
    if company.user_id != user.id and not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Редактировать можно только свою компанию")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, key, value)
    db.commit()
    db.refresh(company)
    return CompanyOut.model_validate(company)
