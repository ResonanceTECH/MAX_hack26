from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config import Settings, get_settings
from ..db import get_db
from ..deps import get_current_user, sync_admin_flag
from ..models import User
from ..roles import (
    ROLE_BUSINESS_USER,
    ROLE_COMPANY_ADMIN,
    ROLE_MODERATOR,
    ROLE_PLATFORM_ADMIN,
    SEED_BUSINESS_USER,
    SEED_COMPANY_ADMIN,
    SEED_MODERATOR,
    SEED_PLATFORM_ADMIN,
)
from ..schemas import AuthInitIn, AuthResponse, UserOut
from ..security import (
    create_access_token,
    init_data_to_user_fields,
    verify_init_data,
)

router = APIRouter(tags=["auth"])

settings: Settings = get_settings()

# Dev role switcher: max_user_id → platform role
DEV_ROLE_BY_MAX_ID = {
    SEED_PLATFORM_ADMIN: ROLE_PLATFORM_ADMIN,
    SEED_COMPANY_ADMIN: ROLE_COMPANY_ADMIN,
    SEED_BUSINESS_USER: ROLE_BUSINESS_USER,
    SEED_MODERATOR: ROLE_MODERATOR,
}


def _user_out(user: User, db: Session) -> UserOut:
    company_id = user.company.id if user.company else None
    if company_id is None:
        from ..services import get_company_for_user

        company = get_company_for_user(db, user)
        company_id = company.id if company else None
    return UserOut(
        id=user.id,
        max_user_id=user.max_user_id,
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username,
        email=user.email,
        role=user.role or (ROLE_PLATFORM_ADMIN if user.is_admin else ROLE_BUSINESS_USER),
        is_admin=user.is_admin or user.role == ROLE_PLATFORM_ADMIN,
        status=getattr(user, "status", None) or "active",
        created_at=user.created_at,
        company_id=company_id,
        last_active_at=user.last_active_at,
    )


def _apply_role(user: User, max_user_id: int) -> None:
    if max_user_id in settings.admin_user_ids or max_user_id == SEED_PLATFORM_ADMIN:
        user.role = ROLE_PLATFORM_ADMIN
    elif max_user_id in DEV_ROLE_BY_MAX_ID:
        user.role = DEV_ROLE_BY_MAX_ID[max_user_id]
    elif not user.role:
        user.role = ROLE_BUSINESS_USER
    sync_admin_flag(user)


def _find_or_create_user(db: Session, fields: dict) -> User:
    max_user_id = fields["max_user_id"]
    user = db.query(User).filter(User.max_user_id == max_user_id).first()
    if user is None:
        user = User(**{k: v for k, v in fields.items() if k in {"max_user_id", "first_name", "last_name", "username"}})
        user.role = ROLE_BUSINESS_USER
        _apply_role(user, max_user_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.first_name = user.first_name or fields.get("first_name")
        user.last_name = user.last_name or fields.get("last_name")
        user.username = user.username or fields.get("username")
        _apply_role(user, max_user_id)
        db.commit()
    return user


def _resolve_fields(payload: AuthInitIn) -> dict | None:
    if payload.init_data:
        data = verify_init_data(payload.init_data, settings.bot_token, settings.initdata_max_age)
        if data:
            return init_data_to_user_fields(data)
    if settings.dev_mode:
        return {
            "max_user_id": payload.dev_max_user_id or 0,
            "first_name": payload.dev_first_name or "Dev",
            "last_name": payload.dev_last_name,
            "username": payload.dev_username,
        }
    return None


def _auth_init_impl(payload: AuthInitIn, db: Session) -> AuthResponse:
    fields = _resolve_fields(payload)
    if fields is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Невалидный initData")
    if fields["max_user_id"] == 0 and payload.init_data is None and payload.dev_max_user_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Укажите dev_max_user_id или init_data")
    user = _find_or_create_user(db, fields)
    token = create_access_token(user.id, settings)
    return AuthResponse(access_token=token, user=_user_out(user, db))


@router.post("/auth/max", response_model=AuthResponse)
def auth_max(payload: AuthInitIn, db: Session = Depends(get_db)) -> AuthResponse:
    return _auth_init_impl(payload, db)


@router.post("/api/auth/init", response_model=AuthResponse, include_in_schema=False)
def auth_init_legacy(payload: AuthInitIn, db: Session = Depends(get_db)) -> AuthResponse:
    return _auth_init_impl(payload, db)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserOut:
    return _user_out(user, db)


@router.get("/api/auth/me", response_model=UserOut, include_in_schema=False)
def me_legacy(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserOut:
    return _user_out(user, db)
