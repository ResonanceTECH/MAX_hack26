from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import (
    get_current_user,
    require_company_admin_member,
    require_company_permission,
)
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
from ..permissions import (
    PERM_EDIT_COMPANY,
    PERM_MANAGE_COMPANY_CASES,
    PERM_MANAGE_COMPANY_DOCUMENTS,
    PERM_MANAGE_COMPANY_SERVICES,
    PERM_MANAGE_COMPANY_SETTINGS,
)
from ..roles import (
    INVITE_STATUS_ACCEPTED,
    INVITE_STATUS_DECLINED,
    INVITE_STATUS_EXPIRED,
    INVITE_STATUS_PENDING,
    MEMBER_ROLES,
    MEMBER_ROLE_ADMIN,
    MEMBER_STATUS_ACTIVE,
    MEMBER_STATUS_DEACTIVATED,
    MEMBER_STATUS_INVITED,
)
from ..schemas import (
    ActivityOut,
    CaseItemIn,
    CaseItemOut,
    CompanyInvitationOut,
    CompanyMemberInviteIn,
    CompanyMemberOut,
    CompanyMemberPatchIn,
    CompanyOut,
    CompanySettingsOut,
    CompanySettingsPatchIn,
    CompanyVerificationOut,
    CompetencyIn,
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
    enqueue_moderation_item,
    ensure_owner_member,
    get_company_or_404,
    get_request_or_404,
    is_company_active,
    require_company,
)
from ..statuses import (
    PUBLIC_SERVICE_STATUS,
    SERVICE_STATUS_ARCHIVED,
    SERVICE_STATUS_DRAFT,
    SERVICE_STATUSES,
    normalize_service_status,
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

TEAM_INVITE_TTL_DAYS = 14



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


INVITE_TTL_DAYS = 30


def _invite_effective_status(inv: OpportunityInvite, req: Request | None) -> str:
    status = getattr(inv, "status", None) or "PENDING"
    if status != "PENDING":
        return status
    now = datetime.now(timezone.utc)
    if req and req.expires_at:
        exp = req.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now:
            return "EXPIRED"
    created = inv.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    if (now - created).days >= INVITE_TTL_DAYS:
        return "EXPIRED"
    return "PENDING"


def _opportunity_invite_out(db: Session, inv: OpportunityInvite) -> OpportunityInviteOut:
    req = db.get(Request, inv.opportunity_id)
    invited = db.get(Company, inv.company_id)
    owner = db.get(Company, req.company_id) if req else None
    return OpportunityInviteOut(
        id=inv.id,
        opportunity_id=inv.opportunity_id,
        opportunity_title=req.title if req else "",
        company_id=inv.company_id,
        company_name=invited.name if invited else "",
        inviting_company_id=owner.id if owner else None,
        inviting_company_name=owner.name if owner else "",
        budget_min=req.budget_min if req else None,
        budget_max=req.budget_max if req else None,
        status=_invite_effective_status(inv, req),
        created_at=inv.created_at,
        responded_at=getattr(inv, "responded_at", None),
    )


def _company_invitation_out(db: Session, m: CompanyMember) -> CompanyInvitationOut:
    company = db.get(Company, m.company_id)
    invited_by = ""
    if m.invited_by_user_id:
        by = db.get(User, m.invited_by_user_id)
        if by:
            invited_by = f"{by.first_name or ''} {by.last_name or ''}".strip() or str(by.id)
    return CompanyInvitationOut(
        token=m.invite_token or str(m.id),
        company_id=m.company_id,
        company_name=company.name if company else "",
        role=m.member_role,
        invited_by=invited_by,
        email=m.email,
        status=_invitation_api_status(m),
        expires_at=m.expires_at,
        first_name=m.first_name or "",
        last_name=m.last_name or "",
        message=m.message,
        id=m.id,
        invited_at=m.invited_at,
    )


def _invitation_api_status(m: CompanyMember) -> str:
    if m.status == MEMBER_STATUS_ACTIVE:
        return INVITE_STATUS_ACCEPTED
    if m.status in {MEMBER_STATUS_DEACTIVATED, "declined"}:
        return INVITE_STATUS_DECLINED
    if m.status == "cancelled":
        return "cancelled"
    if m.status == MEMBER_STATUS_INVITED:
        if m.expires_at:
            exp = m.expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp < datetime.now(timezone.utc):
                return INVITE_STATUS_EXPIRED
        return INVITE_STATUS_PENDING
    return m.status


def _find_invitation(db: Session, token: str) -> CompanyMember | None:
    member = db.query(CompanyMember).filter(CompanyMember.invite_token == token).first()
    if member is not None:
        return member
    if token.isdigit():
        return db.get(CompanyMember, int(token))
    return None


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
    _user, company = require_company_admin_member(user=user, db=db)
    if payload.role not in MEMBER_ROLES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"role: {sorted(MEMBER_ROLES)}")
    email = payload.email.strip().lower()
    dup = (
        db.query(CompanyMember)
        .filter(CompanyMember.company_id == company.id, CompanyMember.email == email)
        .filter(CompanyMember.status.notin_([MEMBER_STATUS_DEACTIVATED, "declined", "cancelled"]))
        .first()
    )
    if dup:
        raise HTTPException(status.HTTP_409_CONFLICT, "Сотрудник с таким email уже есть")
    now = utcnow()
    member = CompanyMember(
        company_id=company.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=email,
        member_role=payload.role,
        status=MEMBER_STATUS_INVITED,
        invite_token=str(uuid.uuid4()),
        invited_by_user_id=user.id,
        expires_at=now + timedelta(days=TEAM_INVITE_TTL_DAYS),
        message=payload.message,
        invited_at=now,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    append_activity(db, company.id, "MEMBER_INVITED", _actor_name(user), "пригласила сотрудника", f"{member.first_name} {member.last_name}")
    return _member_out(member)


def _active_admin_count(db: Session, company: Company, exclude_member_id: int | None = None) -> int:
    q = db.query(CompanyMember).filter(
        CompanyMember.company_id == company.id,
        CompanyMember.member_role == MEMBER_ROLE_ADMIN,
        CompanyMember.status == MEMBER_STATUS_ACTIVE,
        CompanyMember.user_id != company.user_id,
    )
    if exclude_member_id is not None:
        q = q.filter(CompanyMember.id != exclude_member_id)
    return q.count()


@router.patch("/companies/me/members/{member_id}", response_model=CompanyMemberOut)
def patch_member(
    member_id: int,
    payload: CompanyMemberPatchIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _user, company = require_company_admin_member(user=user, db=db)
    member = db.get(CompanyMember, member_id)
    if member is None or member.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сотрудник не найден")
    is_active_admin = (
        member.member_role == MEMBER_ROLE_ADMIN and member.status == MEMBER_STATUS_ACTIVE
    )
    demoting = (payload.role is not None and payload.role != MEMBER_ROLE_ADMIN)
    suspending = (payload.status is not None and payload.status != MEMBER_STATUS_ACTIVE)
    if is_active_admin and (demoting or suspending):
        if _active_admin_count(db, company, exclude_member_id=member.id) == 0:
            raise HTTPException(status.HTTP_409_CONFLICT, "Нельзя понизить или приостановить последнего администратора")
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
    _user, company = require_company_admin_member(user=user, db=db)
    member = db.get(CompanyMember, member_id)
    if member is None or member.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сотрудник не найден")
    if member.user_id == company.user_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Нельзя удалить владельца")
    if member.member_role == MEMBER_ROLE_ADMIN and member.status == MEMBER_STATUS_ACTIVE:
        if _active_admin_count(db, company, exclude_member_id=member.id) == 0:
            raise HTTPException(status.HTTP_409_CONFLICT, "Нельзя удалить последнего администратора")
    member.status = MEMBER_STATUS_DEACTIVATED
    db.commit()
    append_activity(db, company.id, "MEMBER_REMOVED", _actor_name(user), "удалила сотрудника", member.email)
    return {"deleted": True}


@router.post("/companies/me/members/{member_id}/resend", response_model=CompanyMemberOut)
def resend_member_invite(
    member_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _user, company = require_company_admin_member(user=user, db=db)
    member = db.get(CompanyMember, member_id)
    if member is None or member.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сотрудник не найден")
    if member.status != MEMBER_STATUS_INVITED:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Повторная отправка только для статуса invited")
    now = utcnow()
    member.invited_at = now
    member.expires_at = now + timedelta(days=TEAM_INVITE_TTL_DAYS)
    if not member.invite_token:
        member.invite_token = str(uuid.uuid4())
    db.commit()
    db.refresh(member)
    append_activity(db, company.id, "MEMBER_INVITED", _actor_name(user), "повторно отправила приглашение", member.email)
    return _member_out(member)


# ---------- company invitations (invitee accept/decline by token) ----------


@router.get("/company-invitations/{token}", response_model=CompanyInvitationOut)
def get_company_invitation(
    token: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = _find_invitation(db, token)
    if member is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Приглашение не найдено")
    return _company_invitation_out(db, member)


@router.post("/company-invitations/{token}/accept", response_model=CompanyInvitationOut)
def accept_company_invitation(
    token: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = _find_invitation(db, token)
    if member is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Приглашение не найдено")
    api_status = _invitation_api_status(member)
    if api_status == INVITE_STATUS_EXPIRED:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Приглашение истекло")
    if api_status != INVITE_STATUS_PENDING:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Приглашение уже обработано")
    if member.user_id is not None and member.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Приглашение уже привязано к другому пользователю")
    existing = (
        db.query(CompanyMember)
        .filter(
            CompanyMember.user_id == user.id,
            CompanyMember.status == MEMBER_STATUS_ACTIVE,
            CompanyMember.id != member.id,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "У пользователя уже есть активное членство")
    owned = db.query(Company).filter(Company.user_id == user.id).first()
    if owned is not None and owned.id != member.company_id:
        raise HTTPException(status.HTTP_409_CONFLICT, "У пользователя уже есть компания")
    member.user_id = user.id
    member.status = MEMBER_STATUS_ACTIVE
    member.joined_at = utcnow()
    member.last_active_at = utcnow()
    if not user.email:
        user.email = member.email
    if member.first_name and not user.first_name:
        user.first_name = member.first_name
    if member.last_name and not user.last_name:
        user.last_name = member.last_name
    db.commit()
    db.refresh(member)
    append_activity(
        db,
        member.company_id,
        "MEMBER_JOINED",
        _actor_name(user),
        "приняла приглашение в команду",
        f"{member.first_name} {member.last_name}",
    )
    return _company_invitation_out(db, member)


@router.post("/company-invitations/{token}/decline", response_model=CompanyInvitationOut)
def decline_company_invitation(
    token: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = _find_invitation(db, token)
    if member is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Приглашение не найдено")
    api_status = _invitation_api_status(member)
    if api_status == INVITE_STATUS_EXPIRED:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Приглашение истекло")
    if api_status != INVITE_STATUS_PENDING:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Приглашение уже обработано")
    member.status = MEMBER_STATUS_DEACTIVATED
    db.commit()
    db.refresh(member)
    return _company_invitation_out(db, member)


# ---------- services ----------


@router.get("/companies/me/services", response_model=list[ServiceOut])
def list_services(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    rows = db.query(CompanyServiceItem).filter(CompanyServiceItem.company_id == company.id).all()
    return [_service_out(s) for s in rows]


@router.get("/companies/{company_id}/services", response_model=list[ServiceOut])
def list_public_services(company_id: int, db: Session = Depends(get_db)):
    company = get_company_or_404(db, company_id)
    if not is_company_active(company):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Компания не найдена")
    rows = (
        db.query(CompanyServiceItem)
        .filter(CompanyServiceItem.company_id == company_id, CompanyServiceItem.status == PUBLIC_SERVICE_STATUS)
        .all()
    )
    return [_service_out(s) for s in rows]


@router.post("/companies/me/services", response_model=ServiceOut, status_code=201)
def create_service(
    payload: ServiceIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = require_company_permission(db, user, PERM_MANAGE_COMPANY_SERVICES)
    data = payload.model_dump(exclude_unset=True)
    status_value = normalize_service_status(data.get("status") or SERVICE_STATUS_DRAFT)
    if status_value not in SERVICE_STATUSES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"status: {sorted(SERVICE_STATUSES)}")
    item = CompanyServiceItem(
        company_id=company.id,
        **{k: v for k, v in data.items() if v is not None or k in ("description", "title", "category")},
    )
    item.status = status_value
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
    company = require_company_permission(db, user, PERM_MANAGE_COMPANY_SERVICES)
    item = db.get(CompanyServiceItem, service_id)
    if item is None or item.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Услуга не найдена")
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is None:
            continue
        if k == "status":
            v = normalize_service_status(v)
            if v not in SERVICE_STATUSES:
                raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"status: {sorted(SERVICE_STATUSES)}")
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    append_activity(db, company.id, "SERVICE_UPDATED", _actor_name(user), "обновила услугу", item.title)
    return _service_out(item)


@router.delete("/companies/me/services/{service_id}", response_model=dict)
def delete_service(service_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company_permission(db, user, PERM_MANAGE_COMPANY_SERVICES)
    item = db.get(CompanyServiceItem, service_id)
    if item is None or item.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Услуга не найдена")
    item.status = SERVICE_STATUS_ARCHIVED
    db.commit()
    return {"archived": True}


# ---------- competencies ----------


@router.post("/companies/me/competencies", response_model=CompanyOut)
def add_competency(
    payload: CompetencyIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = require_company_permission(db, user, PERM_EDIT_COMPANY)
    value = payload.value.strip()
    if not value:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Компетенция не может быть пустой")
    competencies = list(company.competencies or [])
    if value not in competencies:
        competencies.append(value)
        company.competencies = competencies
        db.commit()
        db.refresh(company)
    append_activity(db, company.id, "COMPETENCY_ADDED", _actor_name(user), "добавила компетенцию", value)
    return CompanyOut.model_validate(company)


@router.delete("/companies/me/competencies/{value:path}", response_model=CompanyOut)
def remove_competency(
    value: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = require_company_permission(db, user, PERM_EDIT_COMPANY)
    competencies = list(company.competencies or [])
    if value not in competencies:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Компетенция не найдена")
    competencies.remove(value)
    company.competencies = competencies
    db.commit()
    db.refresh(company)
    append_activity(db, company.id, "COMPETENCY_REMOVED", _actor_name(user), "удалила компетенцию", value)
    return CompanyOut.model_validate(company)


# ---------- cases ----------


@router.get("/companies/me/cases", response_model=list[CaseItemOut])
def list_cases(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    return [_case_out(c) for c in db.query(CompanyCaseItem).filter(CompanyCaseItem.company_id == company.id).all()]


@router.get("/companies/{company_id}/cases", response_model=list[CaseItemOut])
def list_public_cases(company_id: int, db: Session = Depends(get_db)):
    company = get_company_or_404(db, company_id)
    if not is_company_active(company):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Компания не найдена")
    rows = (
        db.query(CompanyCaseItem)
        .filter(CompanyCaseItem.company_id == company_id, CompanyCaseItem.status == "published")
        .all()
    )
    return [_case_out(c) for c in rows]


@router.post("/companies/me/cases", response_model=CaseItemOut, status_code=201)
def create_case(payload: CaseItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company_permission(db, user, PERM_MANAGE_COMPANY_CASES)
    data = payload.model_dump(exclude_unset=True)
    item = CompanyCaseItem(company_id=company.id, **{k: v for k, v in data.items() if v is not None or k in ("title", "description", "result", "industry")})
    db.add(item)
    db.commit()
    db.refresh(item)
    if item.status == "published":
        enqueue_moderation_item(
            db,
            entity_type="case",
            entity_id=str(item.id),
            title=item.title,
            company_name=company.name,
            owner_id=str(user.id),
            owner_name=_actor_name(user),
            reason="CASE_PUBLISHED",
            summary=item.description or None,
        )
    append_activity(db, company.id, "CASE_CREATED", _actor_name(user), "добавила кейс", item.title)
    return _case_out(item)


@router.patch("/companies/me/cases/{case_id}", response_model=CaseItemOut)
def patch_case(case_id: int, payload: CaseItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company_permission(db, user, PERM_MANAGE_COMPANY_CASES)
    item = db.get(CompanyCaseItem, case_id)
    if item is None or item.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Кейс не найден")
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(item, k, v)
    db.commit()
    db.refresh(item)
    if item.status == "published":
        enqueue_moderation_item(
            db,
            entity_type="case",
            entity_id=str(item.id),
            title=item.title,
            company_name=company.name,
            owner_id=str(user.id),
            owner_name=_actor_name(user),
            reason="CASE_PUBLISHED",
            summary=item.description or None,
        )
    return _case_out(item)


@router.delete("/companies/me/cases/{case_id}", response_model=dict)
def delete_case(case_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company_permission(db, user, PERM_MANAGE_COMPANY_CASES)
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
    company = require_company_permission(db, user, PERM_MANAGE_COMPANY_DOCUMENTS)
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
    enqueue_moderation_item(
        db,
        entity_type="document",
        entity_id=str(item.id),
        title=item.name,
        company_name=company.name,
        owner_id=str(user.id),
        owner_name=_actor_name(user),
        reason="DOCUMENT_UPLOADED",
        summary=f"{item.doc_type or ''} {item.number or ''}".strip() or None,
    )
    append_activity(db, company.id, "DOCUMENT_UPLOADED", _actor_name(user), "загрузила документ", item.name)
    return _doc_out(item)


@router.patch("/companies/me/documents/{document_id}", response_model=DocumentItemOut)
def patch_document(document_id: int, payload: DocumentItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company_permission(db, user, PERM_MANAGE_COMPANY_DOCUMENTS)
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
    company = require_company_permission(db, user, PERM_MANAGE_COMPANY_DOCUMENTS)
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
    company = require_company_permission(db, user, PERM_MANAGE_COMPANY_SETTINGS)
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
    enqueue_moderation_item(
        db,
        entity_type="company",
        entity_id=str(company.id),
        title=f"Верификация: {company.name}",
        company_name=company.name,
        owner_id=str(user.id),
        owner_name=_actor_name(user),
        reason="VERIFICATION_SUBMITTED",
        summary=f"ИНН: {company.inn or '—'}, статус: {company.company_status or '—'}",
        payload={"inn": company.inn, "company_status": company.company_status},
    )
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
    return [_opportunity_invite_out(db, inv) for inv in rows]


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
        return _opportunity_invite_out(db, existing)
    inv = OpportunityInvite(
        opportunity_id=opportunity_id,
        company_id=payload.company_id,
        invited_by_user_id=user.id,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return _opportunity_invite_out(db, inv)


@router.get("/invites/mine", response_model=list[OpportunityInviteOut])
def my_invites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = require_company(db, user)
    rows = db.query(OpportunityInvite).filter(OpportunityInvite.company_id == company.id).all()
    return [_opportunity_invite_out(db, inv) for inv in rows]


@router.post("/invites/{invite_id}/accept", response_model=OpportunityInviteOut)
def accept_opportunity_invite(
    invite_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = require_company(db, user)
    inv = db.get(OpportunityInvite, invite_id)
    if inv is None or inv.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Приглашение не найдено")
    req = db.get(Request, inv.opportunity_id)
    effective = _invite_effective_status(inv, req)
    if effective == "EXPIRED":
        if getattr(inv, "status", "PENDING") == "PENDING":
            inv.status = "EXPIRED"
            db.commit()
            db.refresh(inv)
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Приглашение истекло")
    if effective != "PENDING":
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Приглашение уже обработано")
    inv.status = "ACCEPTED"
    inv.responded_at = utcnow()
    db.commit()
    db.refresh(inv)
    return _opportunity_invite_out(db, inv)


@router.post("/invites/{invite_id}/decline", response_model=OpportunityInviteOut)
def decline_opportunity_invite(
    invite_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = require_company(db, user)
    inv = db.get(OpportunityInvite, invite_id)
    if inv is None or inv.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Приглашение не найдено")
    req = db.get(Request, inv.opportunity_id)
    effective = _invite_effective_status(inv, req)
    if effective == "EXPIRED":
        if getattr(inv, "status", "PENDING") == "PENDING":
            inv.status = "EXPIRED"
            db.commit()
            db.refresh(inv)
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Приглашение истекло")
    if effective != "PENDING":
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Приглашение уже обработано")
    inv.status = "DECLINED"
    inv.responded_at = utcnow()
    db.commit()
    db.refresh(inv)
    return _opportunity_invite_out(db, inv)
