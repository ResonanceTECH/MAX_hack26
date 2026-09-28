from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user, user_has_company_permission
from ..models import Company, CompanyServiceItem, Proposal, Request, User
from ..permissions import PERM_EDIT_COMPANY
from ..schemas import CompanyIn, CompanyOut, CompanyPatchIn, CompanyStatsOut
from ..services import (
    ensure_owner_member,
    get_company_for_user,
    get_company_or_404,
    is_company_active,
    require_company,
)

router = APIRouter(tags=["companies"])


def _split_csv(value: str | None) -> list[str]:
    return [x.strip() for x in value.split(",") if x.strip()] if value else []


def _technologies_for(db: Session, company_ids: list[int]) -> dict[int, list[str]]:
    tech_map: dict[int, set[str]] = {cid: set() for cid in company_ids}
    if company_ids:
        rows = (
            db.query(CompanyServiceItem)
            .filter(
                CompanyServiceItem.company_id.in_(company_ids),
                CompanyServiceItem.status == "published",
            )
            .all()
        )
        for row in rows:
            tech_map.setdefault(row.company_id, set()).update(row.technologies or [])
    return {cid: sorted(techs) for cid, techs in tech_map.items()}


@router.get("/companies", response_model=list[CompanyOut])
def list_companies(
    q: str | None = Query(default=None, description="Поиск по названию/описанию"),
    category: str | None = Query(default=None, description="Отрасль (совместимость)"),
    categories: str | None = Query(default=None, description="Отрасли через запятую"),
    services: str | None = Query(default=None, description="Услуги через запятую"),
    technologies: str | None = Query(default=None, description="Технологии через запятую"),
    region: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    min_rating: float | None = None,
    has_cases: bool = False,
    verified_only: bool = False,
    sort: str | None = Query(default=None, pattern="^(rating_desc|rating_asc|price_asc|price_desc|name)$"),
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[CompanyOut]:
    query = db.query(Company).filter(Company.platform_status.in_(["ACTIVE", None]))
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Company.name.ilike(like), Company.description.ilike(like)))
    if verified_only:
        query = query.filter(Company.is_verified.is_(True))
    if min_rating is not None:
        query = query.filter(Company.rating >= min_rating)
    if min_price is not None:
        query = query.filter(Company.budget_max.isnot(None), Company.budget_max >= min_price)
    if max_price is not None:
        query = query.filter(Company.budget_min.isnot(None), Company.budget_min <= max_price)
    companies = query.all()

    cat_list = _split_csv(categories) or ([category] if category else [])
    svc_list = _split_csv(services)
    tech_list = _split_csv(technologies)

    if cat_list:
        companies = [c for c in companies if any(i in (c.industries or []) for i in cat_list)]
    if region:
        companies = [c for c in companies if region in (c.regions or []) or "Вся Россия" in (c.regions or [])]
    if svc_list:
        companies = [c for c in companies if any(s in (c.services or []) for s in svc_list)]
    if has_cases:
        companies = [c for c in companies if c.cases]
    if tech_list:
        tech_ids = {
            r.company_id
            for r in db.query(CompanyServiceItem)
            .filter(CompanyServiceItem.status == "published")
            .all()
            if any(t in (r.technologies or []) for t in tech_list)
        }
        companies = [c for c in companies if c.id in tech_ids]

    if sort == "rating_desc":
        companies.sort(key=lambda c: c.rating or 0.0, reverse=True)
    elif sort == "rating_asc":
        companies.sort(key=lambda c: c.rating or 0.0)
    elif sort == "price_asc":
        companies.sort(key=lambda c: c.budget_min if c.budget_min is not None else float("inf"))
    elif sort == "price_desc":
        companies.sort(key=lambda c: c.budget_min if c.budget_min is not None else -1.0, reverse=True)
    elif sort == "name":
        companies.sort(key=lambda c: c.name.lower())

    page = companies[offset : offset + limit]
    tech_map = _technologies_for(db, [c.id for c in page])
    out = []
    for c in page:
        item = CompanyOut.model_validate(c)
        item.technologies = tech_map.get(c.id, [])
        out.append(item)
    return out


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
    company = get_company_for_user(db, user)
    if company is not None and not is_company_active(company):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Компания заблокирована или приостановлена: операции недоступны",
        )
    data = payload.model_dump(exclude_unset=True)
    if company is None:
        company = Company(user_id=user.id, **data)
        db.add(company)
    else:
        if not user_has_company_permission(db, user, company, PERM_EDIT_COMPANY):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав для редактирования компании")
        for key, value in data.items():
            setattr(company, key, value)
    db.commit()
    db.refresh(company)
    ensure_owner_member(db, company, user)
    return CompanyOut.model_validate(company)


@router.get("/companies/{company_id}", response_model=CompanyStatsOut)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
) -> CompanyStatsOut:
    company = get_company_or_404(db, company_id)
    if not is_company_active(company):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Компания не найдена")
    active_requests = (
        db.query(Request).filter(Request.company_id == company.id, Request.status == "published").count()
    )
    proposals_count = db.query(Proposal).filter(Proposal.company_id == company.id).count()
    out = CompanyStatsOut.model_validate(company)
    out.technologies = _technologies_for(db, [company.id]).get(company.id, [])
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
    if not is_company_active(company):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Компания заблокирована или приостановлена: операции недоступны",
        )
    my = get_company_for_user(db, user)
    if my is None or my.id != company.id:
        if not user.is_admin:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Редактировать можно только свою компанию")
    elif not user_has_company_permission(db, user, company, PERM_EDIT_COMPANY):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав для редактирования компании")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, key, value)
    db.commit()
    db.refresh(company)
    return CompanyOut.model_validate(company)
