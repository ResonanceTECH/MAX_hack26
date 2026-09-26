"""Platform admin APIs: users, companies, dictionaries, analytics, audit, flags, settings."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import require_platform_admin, sync_admin_flag
from ..models import (
    AuditEvent,
    Company,
    CompanyMember,
    Deal,
    DictionaryItem,
    FeatureFlag,
    ModerationItem,
    PlatformSettings,
    Proposal,
    Report,
    Request,
    RequestMatch,
    User,
    utcnow,
)
from ..roles import PLATFORM_ROLES, ROLE_PLATFORM_ADMIN
from ..schemas import (
    AdminCompanyOut,
    AdminCompanyStatusIn,
    AdminUserOut,
    AdminUserRoleIn,
    AnalyticsOverviewOut,
    AuditEventOut,
    DictionaryItemIn,
    DictionaryItemOut,
    FeatureFlagOut,
    PlatformSettingsOut,
    VerifyIn,
)
from ..services import append_audit

router = APIRouter(prefix="/admin", tags=["platform-admin"])


def _admin_user_out(u: User, db: Session) -> AdminUserOut:
    company = db.query(Company).filter(Company.user_id == u.id).first()
    if company is None:
        m = db.query(CompanyMember).filter(CompanyMember.user_id == u.id, CompanyMember.status == "active").first()
        if m:
            company = db.get(Company, m.company_id)
    return AdminUserOut(
        id=u.id,
        max_user_id=u.max_user_id,
        first_name=u.first_name,
        last_name=u.last_name,
        email=u.email,
        system_role=u.role or ("PLATFORM_ADMIN" if u.is_admin else "BUSINESS_USER"),
        status=getattr(u, "status", None) or "active",
        company_id=company.id if company else None,
        company_name=company.name if company else None,
        created_at=u.created_at,
        last_active_at=u.last_active_at,
    )


@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    q: str | None = None,
    role: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    admin: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role and role != "all":
        query = query.filter(User.role == role)
    if status_filter and status_filter != "all":
        query = query.filter(User.status == status_filter)
    users = query.order_by(User.created_at.desc()).limit(200).all()
    out = [_admin_user_out(u, db) for u in users]
    if q:
        qq = q.lower()
        out = [
            u
            for u in out
            if qq in (u.first_name or "").lower()
            or qq in (u.last_name or "").lower()
            or qq in (u.email or "").lower()
            or qq in (u.company_name or "").lower()
        ]
    return out


@router.get("/users/{user_id}", response_model=AdminUserOut)
def get_user(user_id: int, admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if u is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    return _admin_user_out(u, db)


@router.post("/users/{user_id}/block", response_model=AdminUserOut)
def block_user(user_id: int, reason: str = "", admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if u is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    u.status = "blocked"
    db.commit()
    append_audit(db, actor=admin, action="user.block", entity_type="user", entity_id=str(u.id), reason=reason)
    return _admin_user_out(u, db)


@router.post("/users/{user_id}/unblock", response_model=AdminUserOut)
def unblock_user(user_id: int, admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if u is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    u.status = "active"
    db.commit()
    return _admin_user_out(u, db)


@router.post("/users/{user_id}/suspend", response_model=AdminUserOut)
def suspend_user(user_id: int, admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if u is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    u.status = "suspended"
    db.commit()
    return _admin_user_out(u, db)


@router.post("/users/{user_id}/activate", response_model=AdminUserOut)
def activate_user(user_id: int, admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if u is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    u.status = "active"
    db.commit()
    return _admin_user_out(u, db)


@router.patch("/users/{user_id}/role", response_model=AdminUserOut)
def change_role(user_id: int, payload: AdminUserRoleIn, admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    if payload.new_role not in PLATFORM_ROLES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"role: {sorted(PLATFORM_ROLES)}")
    u = db.get(User, user_id)
    if u is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    before = u.role
    u.role = payload.new_role
    sync_admin_flag(u)
    db.commit()
    append_audit(
        db,
        actor=admin,
        action="user.change_role",
        entity_type="user",
        entity_id=str(u.id),
        reason=payload.reason,
        before={"role": before},
        after={"role": u.role},
    )
    return _admin_user_out(u, db)


@router.get("/companies", response_model=list[AdminCompanyOut])
def list_companies(admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    companies = db.query(Company).order_by(Company.created_at.desc()).limit(200).all()
    out = []
    for c in companies:
        members = db.query(CompanyMember).filter(CompanyMember.company_id == c.id).count()
        out.append(
            AdminCompanyOut(
                id=c.id,
                name=c.name,
                inn=c.inn,
                description=c.description,
                region=(c.regions or [""])[0] if c.regions else "",
                industries=c.industries or [],
                platform_status=getattr(c, "platform_status", None) or "ACTIVE",
                verification_status=getattr(c, "verification_status", None) or ("VERIFIED" if c.is_verified else "NOT_VERIFIED"),
                is_verified=c.is_verified,
                members_count=members or 1,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
        )
    return out


@router.get("/companies/{company_id}", response_model=AdminCompanyOut)
def get_company(company_id: int, admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    c = db.get(Company, company_id)
    if c is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Компания не найдена")
    members = db.query(CompanyMember).filter(CompanyMember.company_id == c.id).count()
    return AdminCompanyOut(
        id=c.id,
        name=c.name,
        inn=c.inn,
        description=c.description,
        region=(c.regions or [""])[0] if c.regions else "",
        industries=c.industries or [],
        platform_status=getattr(c, "platform_status", None) or "ACTIVE",
        verification_status=getattr(c, "verification_status", None) or ("VERIFIED" if c.is_verified else "NOT_VERIFIED"),
        is_verified=c.is_verified,
        members_count=members or 1,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


@router.patch("/companies/{company_id}/status", response_model=AdminCompanyOut)
def change_company_status(
    company_id: int,
    payload: AdminCompanyStatusIn,
    admin: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    c = db.get(Company, company_id)
    if c is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Компания не найдена")
    c.platform_status = payload.platform_status
    db.commit()
    append_audit(db, actor=admin, action="company.status", entity_type="company", entity_id=str(c.id), reason=payload.reason, after={"platform_status": payload.platform_status})
    return get_company(company_id, admin, db)


@router.post("/companies/{company_id}/verification", response_model=AdminCompanyOut)
def set_verification(
    company_id: int,
    payload: VerifyIn,
    admin: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
):
    c = db.get(Company, company_id)
    if c is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Компания не найдена")
    c.is_verified = payload.verified
    c.verification_status = "VERIFIED" if payload.verified else "REJECTED"
    db.commit()
    return get_company(company_id, admin, db)


@router.get("/dictionaries", response_model=list[DictionaryItemOut])
def list_dictionaries(type: str | None = None, admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    q = db.query(DictionaryItem)
    if type:
        q = q.filter(DictionaryItem.type == type)
    return [
        DictionaryItemOut(
            id=d.id,
            type=d.type,
            name=d.name,
            slug=d.slug,
            parent_id=d.parent_id,
            aliases=d.aliases or [],
            status=d.status,
            sort_order=d.sort_order,
            category=d.category,
            description=d.description,
            usage_count=d.usage_count,
            created_at=d.created_at,
            updated_at=d.updated_at,
        )
        for d in q.order_by(DictionaryItem.sort_order).all()
    ]


@router.post("/dictionaries", response_model=DictionaryItemOut, status_code=201)
def create_dictionary(payload: DictionaryItemIn, admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    import re

    slug = payload.slug or re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-")
    item = DictionaryItem(
        type=payload.type,
        name=payload.name,
        slug=slug,
        parent_id=payload.parent_id,
        aliases=payload.aliases or [],
        status=payload.status or "active",
        sort_order=payload.sort_order or 0,
        category=payload.category,
        description=payload.description,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return list_dictionaries(payload.type, admin, db)[-1] if False else DictionaryItemOut(
        id=item.id,
        type=item.type,
        name=item.name,
        slug=item.slug,
        parent_id=item.parent_id,
        aliases=item.aliases or [],
        status=item.status,
        sort_order=item.sort_order,
        category=item.category,
        description=item.description,
        usage_count=item.usage_count,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.patch("/dictionaries/{item_id}", response_model=DictionaryItemOut)
def update_dictionary(item_id: int, payload: DictionaryItemIn, admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    item = db.get(DictionaryItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Элемент не найден")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        if v is not None and hasattr(item, k):
            setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return DictionaryItemOut(
        id=item.id,
        type=item.type,
        name=item.name,
        slug=item.slug,
        parent_id=item.parent_id,
        aliases=item.aliases or [],
        status=item.status,
        sort_order=item.sort_order,
        category=item.category,
        description=item.description,
        usage_count=item.usage_count,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get("/analytics/overview", response_model=AnalyticsOverviewOut)
def analytics_overview(admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    return AnalyticsOverviewOut(
        users_total=db.query(func.count(User.id)).scalar() or 0,
        companies_total=db.query(func.count(Company.id)).scalar() or 0,
        opportunities_open=db.query(func.count(Request.id)).filter(Request.status == "published").scalar() or 0,
        deals_active=db.query(func.count(Deal.id)).filter(Deal.status == "negotiating").scalar() or 0,
        matches_this_month=db.query(func.count(RequestMatch.id)).scalar() or 0,
        moderation_pending=db.query(func.count(ModerationItem.id)).filter(ModerationItem.status.in_(["PENDING", "IN_REVIEW"])).scalar() or 0,
        open_reports=db.query(func.count(Report.id)).filter(Report.status.in_(["OPEN", "IN_PROGRESS"])).scalar() or 0,
        proposals=db.query(func.count(Proposal.id)).scalar() or 0,
        is_model_data=True,
    )


@router.get("/audit", response_model=list[AuditEventOut])
def list_audit(admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    rows = db.query(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(200).all()
    return [
        AuditEventOut(
            id=e.id,
            actor_id=e.actor_id,
            actor_name=e.actor_name,
            actor_role=e.actor_role,
            action=e.action,
            entity_type=e.entity_type,
            entity_id=e.entity_id,
            entity_name=e.entity_name,
            reason=e.reason,
            before=e.before,
            after=e.after,
            details=e.details,
            created_at=e.created_at,
        )
        for e in rows
    ]


@router.get("/feature-flags", response_model=list[FeatureFlagOut])
def list_flags(admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    rows = db.query(FeatureFlag).order_by(FeatureFlag.key).all()
    if not rows:
        defaults = [
            ("matching_v2", "Matching v2", False),
            ("deal_room", "Deal Room", True),
            ("moderation_queue", "Moderation Queue", True),
        ]
        for key, name, enabled in defaults:
            db.add(FeatureFlag(key=key, name=name, enabled=enabled, description=name))
        db.commit()
        rows = db.query(FeatureFlag).order_by(FeatureFlag.key).all()
    return [
        FeatureFlagOut(
            id=f.id,
            key=f.key,
            name=f.name,
            description=f.description or "",
            enabled=f.enabled,
            scope=f.scope,
            updated_by=f.updated_by,
            updated_at=f.updated_at,
        )
        for f in rows
    ]


@router.patch("/feature-flags/{flag_id}", response_model=FeatureFlagOut)
def toggle_flag(flag_id: int, enabled: bool, admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    f = db.get(FeatureFlag, flag_id)
    if f is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Flag не найден")
    f.enabled = enabled
    f.updated_by = f"{admin.first_name or ''} {admin.last_name or ''}".strip()
    db.commit()
    db.refresh(f)
    return FeatureFlagOut(
        id=f.id,
        key=f.key,
        name=f.name,
        description=f.description or "",
        enabled=f.enabled,
        scope=f.scope,
        updated_by=f.updated_by,
        updated_at=f.updated_at,
    )


@router.get("/settings", response_model=PlatformSettingsOut)
def get_settings(admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    row = db.query(PlatformSettings).first()
    if row is None:
        row = PlatformSettings(
            general={"appName": "B2B Match"},
            moderation={"autoQueue": True},
            matching={"minScore": 60},
            notifications={"email": False},
            maintenance={"enabled": False},
            announcement={},
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    return PlatformSettingsOut(
        general=row.general or {},
        moderation=row.moderation or {},
        matching=row.matching or {},
        notifications=row.notifications or {},
        maintenance=row.maintenance or {},
        announcement=row.announcement or {},
    )


@router.patch("/settings", response_model=PlatformSettingsOut)
def patch_settings(payload: PlatformSettingsOut, admin: User = Depends(require_platform_admin), db: Session = Depends(get_db)):
    row = db.query(PlatformSettings).first()
    if row is None:
        row = PlatformSettings()
        db.add(row)
    if payload.general:
        row.general = {**(row.general or {}), **payload.general}
    if payload.moderation:
        row.moderation = {**(row.moderation or {}), **payload.moderation}
    if payload.matching:
        row.matching = {**(row.matching or {}), **payload.matching}
    if payload.notifications:
        row.notifications = {**(row.notifications or {}), **payload.notifications}
    if payload.maintenance:
        row.maintenance = {**(row.maintenance or {}), **payload.maintenance}
    if payload.announcement:
        row.announcement = {**(row.announcement or {}), **payload.announcement}
    db.commit()
    return get_settings(admin, db)
