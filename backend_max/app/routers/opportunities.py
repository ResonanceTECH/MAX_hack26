from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..config import Settings, get_settings
from ..db import get_db
from ..deps import get_current_user, require_company_permission
from ..models import Company, Deal, Proposal, Request, RequestMatch, UploadedFile, User
from ..permissions import PERM_CREATE_OPPORTUNITY, STAFF_ROLES
from ..schemas import (
    CompareOut,
    CompareRowOut,
    DealRoomOut,
    FileOut,
    MatchOut,
    RequestCreateIn,
    RequestDetailOut,
    RequestOut,
    RequestPatchIn,
    StructuredRequestOut,
)
from ..services import (
    ensure_owns_request,
    get_request_or_404,
    match_out,
    proposal_out,
    publish_request,
    recompute_matches,
    request_detail_out,
    request_out,
    require_company,
)
from ..structurizer import structure_request, structure_with_llm

router = APIRouter(tags=["opportunities"])

settings: Settings = get_settings()

SHORTLIST_STATUSES = {"shortlisted", "negotiating", "chosen"}


def _structurize(payload: RequestCreateIn) -> dict:
    description = (payload.description or "").strip()
    if not description:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Передайте description")
    return structure_with_llm(description, settings) or structure_request(description)


@router.post("/ai/parse-opportunity", response_model=StructuredRequestOut)
def ai_parse(payload: RequestCreateIn) -> StructuredRequestOut:
    """AI-структуризация свободного описания потребности без публикации."""
    return StructuredRequestOut(**_structurize(payload))


@router.post("/opportunities/preview", response_model=StructuredRequestOut)
def preview_opportunity(payload: RequestCreateIn) -> StructuredRequestOut:
    """Совместимый алиас /ai/parse-opportunity."""
    return StructuredRequestOut(**_structurize(payload))


@router.post("/opportunities", response_model=RequestDetailOut, status_code=status.HTTP_201_CREATED)
def create_opportunity(
    payload: RequestCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RequestDetailOut:
    """Создаёт потребность. Свободное описание структурируется автоматически.

    Если publish=false — запрос сохраняется как draft (публикация отдельно:
    POST /opportunities/{id}/publish).
    """
    if user.role in STAFF_ROLES or user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Модераторы и админы платформы не публикуют запросы")
    company = require_company_permission(db, user, PERM_CREATE_OPPORTUNITY)

    description = (payload.description or "").strip()
    if description and not payload.title:
        structured = _structurize(payload)
        title = structured["title"] or f"Запрос от {company.name}"
        category = structured["category"]
        subcategory = structured["subcategory"]
        requirements = structured["requirements"]
        required_certificates = structured["required_certificates"] or payload.required_certificates
        budget_min = structured["budget_min"] if payload.budget_min is None else payload.budget_min
        budget_max = structured["budget_max"] if payload.budget_max is None else payload.budget_max
        deadline_days = structured["deadline_days"] if payload.deadline_days is None else payload.deadline_days
        regions = structured["regions"] or payload.regions
    else:
        title = payload.title or "Новый запрос"
        category = payload.category or "Прочее"
        subcategory = payload.subcategory
        requirements = payload.requirements
        required_certificates = payload.required_certificates
        budget_min = payload.budget_min
        budget_max = payload.budget_max
        deadline_days = payload.deadline_days
        regions = payload.regions

    request = Request(
        company_id=company.id,
        title=title,
        description_raw=description or None,
        category=category,
        subcategory=subcategory,
        requirements=requirements,
        required_certificates=required_certificates,
        budget_min=budget_min,
        budget_max=budget_max,
        deadline_days=deadline_days,
        regions=regions,
        proposals_deadline_days=payload.proposals_deadline_days or 14,
        status="draft",
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    if payload.publish:
        publish_request(db, request)
        recompute_matches(db, request, notify=True)
    return request_detail_out(request, db)


@router.get("/opportunities", response_model=list[RequestOut])
def list_opportunities(
    q: str | None = None,
    category: str | None = None,
    region: str | None = None,
    budget_max: int | None = None,
    limit: int = Query(default=50, le=100),
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[RequestOut]:
    """Витрина опубликованных потребностей (без персонального матчинга)."""
    query = db.query(Request).filter(Request.status == "published")
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Request.title.ilike(like), Request.description_raw.ilike(like)))
    requests = query.order_by(Request.published_at.desc()).offset(offset).limit(limit).all()
    if category:
        requests = [r for r in requests if r.category == category]
    if region:
        requests = [r for r in requests if region in (r.regions or [])]
    if budget_max:
        requests = [r for r in requests if (r.budget_max or float("inf")) <= budget_max]
    return [request_out(r, db) for r in requests]


@router.get("/opportunities/mine", response_model=list[RequestOut])
def my_opportunities(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[RequestOut]:
    company = require_company(db, user)
    requests = (
        db.query(Request)
        .filter(Request.company_id == company.id)
        .order_by(Request.created_at.desc())
        .all()
    )
    return [request_out(r, db) for r in requests]


@router.get("/opportunities/{opportunity_id}", response_model=RequestDetailOut)
def get_opportunity(
    opportunity_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RequestDetailOut:
    request = get_request_or_404(db, opportunity_id)
    return request_detail_out(request, db)


@router.patch("/opportunities/{opportunity_id}", response_model=RequestDetailOut)
def patch_opportunity(
    opportunity_id: int,
    payload: RequestPatchIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RequestDetailOut:
    """Изменяет параметры потребности (только автор). При публикации матчи пересчитываются."""
    request = get_request_or_404(db, opportunity_id)
    company = require_company(db, user)
    ensure_owns_request(user, company, request)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(request, key, value)
    db.commit()
    if request.status == "published":
        recompute_matches(db, request, notify=False)
    return request_detail_out(request, db)


@router.post("/opportunities/{opportunity_id}/publish", response_model=RequestDetailOut)
def publish_opportunity(
    opportunity_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RequestDetailOut:
    """Публикует draft и запускает двусторонний матчинг."""
    request = get_request_or_404(db, opportunity_id)
    company = require_company(db, user)
    ensure_owns_request(user, company, request)
    if request.status == "published":
        raise HTTPException(status.HTTP_409_CONFLICT, "Потребность уже опубликована")
    publish_request(db, request)
    recompute_matches(db, request, notify=True)
    return request_detail_out(request, db)


@router.post("/opportunities/{opportunity_id}/close", response_model=RequestOut)
def close_opportunity(
    opportunity_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RequestOut:
    request = get_request_or_404(db, opportunity_id)
    company = require_company(db, user)
    ensure_owns_request(user, company, request)
    request.status = "closed"
    db.commit()
    return request_out(request, db)


@router.post("/opportunities/{opportunity_id}/reopen", response_model=RequestOut)
def reopen_opportunity(
    opportunity_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RequestOut:
    request = get_request_or_404(db, opportunity_id)
    company = require_company(db, user)
    ensure_owns_request(user, company, request)
    request.status = "published"
    expires = request.expires_at
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires is None or expires < datetime.now(timezone.utc):
        request.expires_at = datetime.now(timezone.utc) + timedelta(
            days=request.proposals_deadline_days
        )
    db.commit()
    recompute_matches(db, request, notify=False)
    return request_out(request, db)


@router.get("/opportunities/{opportunity_id}/matches", response_model=list[MatchOut])
def opportunity_matches(
    opportunity_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MatchOut]:
    request = get_request_or_404(db, opportunity_id)
    company = require_company(db, user)
    ensure_owns_request(user, company, request)
    matches = (
        db.query(RequestMatch)
        .filter(RequestMatch.request_id == request.id)
        .order_by(RequestMatch.score.desc())
        .all()
    )
    return [match_out(m, db) for m in matches]


@router.get("/opportunities/{opportunity_id}/comparison", response_model=CompareOut)
def comparison(
    opportunity_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompareOut:
    """Comparison Board: отклики и компании в единой структуре."""
    request = get_request_or_404(db, opportunity_id)
    company = require_company(db, user)
    ensure_owns_request(user, company, request)

    proposals = db.query(Proposal).filter(Proposal.request_id == request.id).all()
    match_scores: dict[int, int] = {}
    requirements_met: dict[int, str] = {}
    matches = db.query(RequestMatch).filter(RequestMatch.request_id == request.id).all()
    for m in matches:
        match_scores[m.company_id] = m.score
        req_criteria = next((c for c in (m.criteria or []) if c.get("key") == "requirements"), None)
        requirements_met[m.company_id] = req_criteria.get("detail", "") if req_criteria else ""

    rows: list[CompareRowOut] = []
    for p in proposals:
        c = db.get(Company, p.company_id)
        if c is None:
            continue
        rows.append(
            CompareRowOut(
                company_id=c.id,
                company_name=c.name,
                rating=c.rating or 0.0,
                cases_count=len(c.cases or []),
                requirements_met=requirements_met.get(c.id, "0/0"),
                match_score=match_scores.get(c.id, 0),
                price=p.price,
                term_days=p.term_days,
                status=p.status,
            )
        )
    rows.sort(key=lambda r: (r.status not in SHORTLIST_STATUSES, -(r.match_score or 0), r.price or 0))

    return CompareOut(
        request_id=request.id,
        request_title=request.title,
        requirements=request.requirements or [],
        rows=rows,
    )


@router.get("/opportunities/{opportunity_id}/compare", response_model=CompareOut, include_in_schema=False)
def comparison_legacy(
    opportunity_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompareOut:
    return comparison(opportunity_id, user, db)


@router.get("/opportunities/{opportunity_id}/dealroom", response_model=DealRoomOut)
def deal_room(
    opportunity_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DealRoomOut:
    """Deal Room: единый контекст взаимодействия по потребности."""
    request = get_request_or_404(db, opportunity_id)
    company = require_company(db, user)
    ensure_owns_request(user, company, request)

    proposals = db.query(Proposal).filter(Proposal.request_id == request.id).all()
    proposal_list = [proposal_out(p, db) for p in proposals]
    shortlist = [p for p in proposal_list if p.status in SHORTLIST_STATUSES]

    deal_ids = [d.id for d in db.query(Deal).filter(Deal.opportunity_id == request.id).all()]
    files_query = [UploadedFile.opportunity_id == request.id]
    if deal_ids:
        files_query.append(UploadedFile.deal_id.in_(deal_ids))
    files = db.query(UploadedFile).filter(*files_query).all()

    chosen = [p for p in proposal_list if p.status == "chosen"]
    if chosen:
        next_action = "Исполнитель выбран — согласуйте детали в переговорах"
    elif shortlist:
        next_action = "Начните переговоры с компаниями из shortlist и выберите исполнителя"
    elif proposal_list:
        next_action = "Сравните предложения и добавьте лучшие в shortlist"
    elif request.status == "published":
        next_action = "Ожидание предложений — рекомендации отправлены подходящим исполнителям"
    else:
        next_action = "Запрос закрыт"

    return DealRoomOut(
        request=request_out(request, db),
        proposals=proposal_list,
        shortlist=shortlist,
        files=[FileOut.model_validate(f) for f in files],
        next_action=next_action,
    )
