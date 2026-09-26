"""Company workspace: members, services, cases, documents, settings, verification, activity, invites."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import (
    Company,
    CompanyActivityEvent,
    CompanyCaseItem,
    CompanyDocumentItem,
    CompanyMember,
    CompanyServiceItem,
    OpportunityInvite,
    Request,
    User,
    utcnow,
)
from ..roles import MEMBER_ROLES, MEMBER_STATUS_ACTIVE, MEMBER_STATUS_INVITED
from ..schemas import (
    ActivityOut,
    CaseItemIn,
    CaseItemOut,
    CompanyMemberInviteIn,
    CompanyMemberOut,
    CompanyMemberPatchIn,
    CompanySettingsOut,
    CompanySettingsPatchIn,
    CompanyVerificationOut,
    DocumentItemIn,
    DocumentItemOut,
    OpportunityInviteIn,
    OpportunityInviteOut,
    ServiceIn,
    ServiceOut,
    VerificationBlockOut,
)
from ..services import (
    append_activity,
    ensure_owner_member,
    get_request_or_404,
    require_company,
)

router = APIRouter(tags=["company-workspace"])

DEFAULT_SETTINGS = {
    "notifications": {
        "newProposals": True,
        "matchingOrders": True,
        "proposalStatusChanges": True,
        "shortlist": True,
        "negotiations": True,
        "deadlineReminders": True,
        "companyManagementEvents": True,
    },
    "visibility": {
        "publicProfile": True,
        "showServices": True,
        "showPrices": True,
        "showCases": True,
        "showDocuments": False,
    },
    "matching": {
        "receiveOrderRecommendations": True,
        "showInCustomerRecommendations": True,
        "useCasesInMatching": True,
        "useDocumentsInMatching": False,
    },
    "archived": False,
}


def _actor_name(user: User) -> str:
    return f"{user.first_name or ''} {user.last_name or ''}".strip() or f"user-{user.id}"


def _member_out(m: CompanyMember) -> CompanyMemberOut:
    return CompanyMemberOut(
        id=m.id,
        user_id=m.user_id,
        company_id=m.company_id,
        first_name=m.first_name,
        last_name=m.last_name,
        email=m.email,
        role=m.member_role,
        status=m.status,
        invited_at=m.invited_at,
        joined_at=m.joined_at,
        last_active_at=m.last_active_at,
    )


def _service_out(s: CompanyServiceItem) -> ServiceOut:
    return ServiceOut(
        id=s.id,
        company_id=s.company_id,
        title=s.title,
        description=s.description or "",
        category=s.category or "",
        status=s.status,
        short_description=s.short_description,
        price_min=s.price_min,
        price_max=s.price_max,
        currency=s.currency or "RUB",
        regions=s.regions or [],
        remote=bool(s.remote),
        technologies=s.technologies or [],
        capabilities=s.capabilities or [],
        target_industries=s.target_industries or [],
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


def _case_out(c: CompanyCaseItem) -> CaseItemOut:
    return CaseItemOut(
        id=c.id,
        company_id=c.company_id,
        title=c.title,
        industry=c.industry or "",
        description=c.description or "",
        result=c.result or "",
        technologies=c.technologies or [],
        status=c.status,
        client_name=c.client_name,
        client_visible=bool(c.client_visible),
        solution=c.solution,
        start_date=c.start_date,
        end_date=c.end_date,
        cover_url=c.cover_url,
        external_url=c.external_url,
        capabilities=c.capabilities or [],
    )


def _doc_out(d: CompanyDocumentItem) -> DocumentItemOut:
    return DocumentItemOut(
        id=d.id,
        company_id=d.company_id,
        name=d.name,
        type=d.doc_type,
        file_name=d.file_name,
        status=d.status,
        number=d.number,
        issuer=d.issuer,
        issued_at=d.issued_at,
        expires_at=d.expires_at,
        file_url=d.file_url,
        verification_source=d.verification_source,
        uploaded_at=d.uploaded_at,
        updated_at=d.updated_at,
    )


# ---------- members ----------


@router.get("/companies/me/members", response_model=list[CompanyMemberOut])
def list_members(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    ensure_owner_member(db, company, company.user if hasattr(company, "user") else user)
    # ensure owner of company has membership
    owner = db.get(User, company.user_id)
    if owner:
        ensure_owner_member(db, company, owner)
    rows = db.query(CompanyMember).filter(CompanyMember.company_id == company.id).all()
    return [_member_out(m) for m in rows]


@router.post("/companies/me/members", response_model=CompanyMemberOut, status_code=201)
def invite_member(
    payload: CompanyMemberInviteIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = require_company(db, user)
    if company.user_id != user.id and user.role not in {"COMPANY_ADMIN", "PLATFORM_ADMIN"} and not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Только админ компании может приглашать")
    if payload.role not in MEMBER_ROLES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"role: {sorted(MEMBER_ROLES)}")
    email = payload.email.strip().lower()
    dup = (
        db.query(CompanyMember)
        .filter(CompanyMember.company_id == company.id, CompanyMember.email == email)
        .filter(CompanyMember.status != "deactivated")
        .first()
    )
    if dup:
        raise HTTPException(status.HTTP_409_CONFLICT, "Сотрудник с таким email уже есть")
    member = CompanyMember(
        company_id=company.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=email,
        member_role=payload.role,
        status=MEMBER_STATUS_INVITED,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    append_activity(db, company.id, "MEMBER_INVITED", _actor_name(user), "пригласила сотрудника", f"{member.first_name} {member.last_name}")
    return _member_out(member)


@router.patch("/companies/me/members/{member_id}", response_model=CompanyMemberOut)
def patch_member(
    member_id: int,
    payload: CompanyMemberPatchIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = require_company(db, user)
    member = db.get(CompanyMember, member_id)
    if member is None or member.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сотрудник не найден")
    if payload.role is not None:
        if payload.role not in MEMBER_ROLES:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Недопустимая роль")
        member.member_role = payload.role
    if payload.status is not None:
        member.status = payload.status
    db.commit()
    db.refresh(member)
    append_activity(db, company.id, "MEMBER_ROLE_CHANGED", _actor_name(user), "обновила сотрудника", member.email)
    return _member_out(member)


@router.delete("/companies/me/members/{member_id}", response_model=dict)
def remove_member(
    member_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = require_company(db, user)
    member = db.get(CompanyMember, member_id)
    if member is None or member.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сотрудник не найден")
    if member.user_id == company.user_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Нельзя удалить владельца")
    member.status = "deactivated"
    db.commit()
    append_activity(db, company.id, "MEMBER_REMOVED", _actor_name(user), "удалила сотрудника", member.email)
    return {"deleted": True}


# ---------- services ----------


@router.get("/companies/me/services", response_model=list[ServiceOut])
def list_services(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    rows = db.query(CompanyServiceItem).filter(CompanyServiceItem.company_id == company.id).all()
    return [_service_out(s) for s in rows]


@router.get("/companies/{company_id}/services", response_model=list[ServiceOut])
def list_public_services(company_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(CompanyServiceItem)
        .filter(CompanyServiceItem.company_id == company_id, CompanyServiceItem.status == "active")
        .all()
    )
    return [_service_out(s) for s in rows]


@router.post("/companies/me/services", response_model=ServiceOut, status_code=201)
def create_service(
    payload: ServiceIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = require_company(db, user)
    data = payload.model_dump(exclude_unset=True)
    item = CompanyServiceItem(company_id=company.id, **{k: v for k, v in data.items() if v is not None or k in ("description", "title", "category")})
    if "status" not in data or data["status"] is None:
        item.status = "draft"
    db.add(item)
    db.commit()
    db.refresh(item)
    append_activity(db, company.id, "SERVICE_CREATED", _actor_name(user), "добавила услугу", item.title)
    return _service_out(item)


@router.patch("/companies/me/services/{service_id}", response_model=ServiceOut)
def patch_service(
    service_id: int,
    payload: ServiceIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = require_company(db, user)
    item = db.get(CompanyServiceItem, service_id)
    if item is None or item.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Услуга не найдена")
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(item, k, v)
    db.commit()
    db.refresh(item)
    append_activity(db, company.id, "SERVICE_UPDATED", _actor_name(user), "обновила услугу", item.title)
    return _service_out(item)


@router.delete("/companies/me/services/{service_id}", response_model=dict)
def delete_service(service_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    item = db.get(CompanyServiceItem, service_id)
    if item is None or item.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Услуга не найдена")
    item.status = "archived"
    db.commit()
    return {"archived": True}


# ---------- cases ----------


@router.get("/companies/me/cases", response_model=list[CaseItemOut])
def list_cases(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    return [_case_out(c) for c in db.query(CompanyCaseItem).filter(CompanyCaseItem.company_id == company.id).all()]


@router.get("/companies/{company_id}/cases", response_model=list[CaseItemOut])
def list_public_cases(company_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(CompanyCaseItem)
        .filter(CompanyCaseItem.company_id == company_id, CompanyCaseItem.status == "published")
        .all()
    )
    return [_case_out(c) for c in rows]


@router.post("/companies/me/cases", response_model=CaseItemOut, status_code=201)
def create_case(payload: CaseItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    data = payload.model_dump(exclude_unset=True)
    item = CompanyCaseItem(company_id=company.id, **{k: v for k, v in data.items() if v is not None or k in ("title", "description", "result", "industry")})
    db.add(item)
    db.commit()
    db.refresh(item)
    append_activity(db, company.id, "CASE_CREATED", _actor_name(user), "добавила кейс", item.title)
    return _case_out(item)


@router.patch("/companies/me/cases/{case_id}", response_model=CaseItemOut)
def patch_case(case_id: int, payload: CaseItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    item = db.get(CompanyCaseItem, case_id)
    if item is None or item.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Кейс не найден")
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return _case_out(item)


@router.delete("/companies/me/cases/{case_id}", response_model=dict)
def delete_case(case_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    item = db.get(CompanyCaseItem, case_id)
    if item is None or item.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Кейс не найден")
    item.status = "archived"
    db.commit()
    return {"archived": True}


# ---------- documents ----------


@router.get("/companies/me/documents", response_model=list[DocumentItemOut])
def list_documents(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    return [_doc_out(d) for d in db.query(CompanyDocumentItem).filter(CompanyDocumentItem.company_id == company.id).all()]


@router.post("/companies/me/documents", response_model=DocumentItemOut, status_code=201)
def add_document(payload: DocumentItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    item = CompanyDocumentItem(
        company_id=company.id,
        name=payload.name,
        doc_type=payload.type,
        file_name=payload.file_name,
        number=payload.number,
        issuer=payload.issuer,
        issued_at=payload.issued_at,
        expires_at=payload.expires_at,
        file_url=payload.file_url,
        verification_source=payload.verification_source or "COMPANY_DATA",
        status="Pending",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    append_activity(db, company.id, "DOCUMENT_UPLOADED", _actor_name(user), "загрузила документ", item.name)
    return _doc_out(item)


@router.patch("/companies/me/documents/{document_id}", response_model=DocumentItemOut)
def patch_document(document_id: int, payload: DocumentItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    item = db.get(CompanyDocumentItem, document_id)
    if item is None or item.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Документ не найден")
    data = payload.model_dump(exclude_unset=True)
    if "type" in data:
        item.doc_type = data.pop("type") or item.doc_type
    for k, v in data.items():
        if v is not None and hasattr(item, k):
            setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return _doc_out(item)


@router.delete("/companies/me/documents/{document_id}", response_model=dict)
def delete_document(document_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    item = db.get(CompanyDocumentItem, document_id)
    if item is None or item.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Документ не найден")
    db.delete(item)
    db.commit()
    return {"deleted": True}


# ---------- settings / verification / activity ----------


@router.get("/companies/me/settings", response_model=CompanySettingsOut)
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    raw = company.settings_json or {}
    merged = {**DEFAULT_SETTINGS, **raw}
    merged["notifications"] = {**DEFAULT_SETTINGS["notifications"], **(raw.get("notifications") or {})}
    merged["visibility"] = {**DEFAULT_SETTINGS["visibility"], **(raw.get("visibility") or {})}
    merged["matching"] = {**DEFAULT_SETTINGS["matching"], **(raw.get("matching") or {})}
    return CompanySettingsOut(
        company_id=company.id,
        notifications=merged["notifications"],
        visibility=merged["visibility"],
        matching=merged["matching"],
        archived=bool(merged.get("archived", False)),
    )


@router.patch("/companies/me/settings", response_model=CompanySettingsOut)
def patch_settings(
    payload: CompanySettingsPatchIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = require_company(db, user)
    current = dict(company.settings_json or {})
    if payload.notifications:
        current["notifications"] = {**(current.get("notifications") or {}), **payload.notifications}
    if payload.visibility:
        current["visibility"] = {**(current.get("visibility") or {}), **payload.visibility}
    if payload.matching:
        current["matching"] = {**(current.get("matching") or {}), **payload.matching}
    if payload.archived is not None:
        current["archived"] = payload.archived
    company.settings_json = current
    db.commit()
    append_activity(db, company.id, "SETTINGS_UPDATED", _actor_name(user), "обновила настройки компании", "Настройки")
    return get_settings(user, db)


@router.get("/companies/me/verification", response_model=CompanyVerificationOut)
def get_verification(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    status_map = {
        True: "VERIFIED",
        False: company.verification_status or "NOT_VERIFIED",
    }
    overall = "VERIFIED" if company.is_verified else (company.verification_status or "NOT_VERIFIED")
    blocks = [
        VerificationBlockOut(id="legal-entity", label="Юридическое лицо", status="complete" if company.name else "incomplete", source="COMPANY_DATA", description=company.name),
        VerificationBlockOut(id="inn", label="ИНН", status="complete" if company.inn else "incomplete", source="MODEL_DATA", description=company.inn),
        VerificationBlockOut(id="basics", label="Основные данные", status="complete" if company.description else "incomplete", source="COMPANY_DATA"),
        VerificationBlockOut(id="documents", label="Документы", status="pending" if overall == "PENDING" else ("complete" if company.is_verified else "incomplete"), source="PLATFORM_VERIFIED"),
    ]
    return CompanyVerificationOut(
        company_id=company.id,
        status=overall if overall in {"NOT_VERIFIED", "PENDING", "VERIFIED", "REJECTED", "REQUIRES_UPDATE"} else status_map[False],
        blocks=blocks,
        updated_at=company.updated_at or utcnow(),
    )


@router.post("/companies/me/verification", response_model=CompanyVerificationOut)
def submit_verification(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    company.verification_status = "PENDING"
    db.commit()
    return get_verification(user, db)


@router.get("/companies/me/activity", response_model=list[ActivityOut])
def list_activity(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    rows = (
        db.query(CompanyActivityEvent)
        .filter(CompanyActivityEvent.company_id == company.id)
        .order_by(CompanyActivityEvent.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        ActivityOut(
            id=r.id,
            company_id=r.company_id,
            type=r.type,
            actor_name=r.actor_name,
            action=r.action,
            entity_label=r.entity_label,
            created_at=r.created_at,
        )
        for r in rows
    ]


# ---------- opportunity invites ----------


@router.get("/opportunities/{opportunity_id}/invites", response_model=list[OpportunityInviteOut])
def list_invites(opportunity_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    request = get_request_or_404(db, opportunity_id)
    company = require_company(db, user)
    if request.company_id != company.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Только автор запроса")
    rows = db.query(OpportunityInvite).filter(OpportunityInvite.opportunity_id == opportunity_id).all()
    out = []
    for inv in rows:
        c = db.get(Company, inv.company_id)
        out.append(
            OpportunityInviteOut(
                id=inv.id,
                opportunity_id=inv.opportunity_id,
                opportunity_title=request.title,
                company_id=inv.company_id,
                company_name=c.name if c else "",
                created_at=inv.created_at,
            )
        )
    return out


@router.post("/opportunities/{opportunity_id}/invites", response_model=OpportunityInviteOut, status_code=201)
def create_invite(
    opportunity_id: int,
    payload: OpportunityInviteIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = get_request_or_404(db, opportunity_id)
    company = require_company(db, user)
    if request.company_id != company.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Только автор запроса")
    target = db.get(Company, payload.company_id)
    if target is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Компания не найдена")
    existing = (
        db.query(OpportunityInvite)
        .filter(
            OpportunityInvite.opportunity_id == opportunity_id,
            OpportunityInvite.company_id == payload.company_id,
        )
        .first()
    )
    if existing:
        return OpportunityInviteOut(
            id=existing.id,
            opportunity_id=existing.opportunity_id,
            opportunity_title=request.title,
            company_id=existing.company_id,
            company_name=target.name,
            created_at=existing.created_at,
        )
    inv = OpportunityInvite(
        opportunity_id=opportunity_id,
        company_id=payload.company_id,
        invited_by_user_id=user.id,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return OpportunityInviteOut(
        id=inv.id,
        opportunity_id=inv.opportunity_id,
        opportunity_title=request.title,
        company_id=inv.company_id,
        company_name=target.name,
        created_at=inv.created_at,
    )


@router.get("/invites/mine", response_model=list[OpportunityInviteOut])
def my_invites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    rows = db.query(OpportunityInvite).filter(OpportunityInvite.company_id == company.id).all()
    out = []
    for inv in rows:
        req = db.get(Request, inv.opportunity_id)
        out.append(
            OpportunityInviteOut(
                id=inv.id,
                opportunity_id=inv.opportunity_id,
                opportunity_title=req.title if req else "",
                company_id=inv.company_id,
                company_name=company.name,
                created_at=inv.created_at,
            )
        )
    return out
