from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .db import get_db
from .models import Company, CompanyMember, User
from .roles import (
    MEMBER_ROLE_ADMIN,
    MEMBER_STATUS_ACTIVE,
    PLATFORM_ROLES,
    ROLE_MODERATOR,
    ROLE_PLATFORM_ADMIN,
)
from .security import decode_access_token

settings: Settings = get_settings()


def sync_admin_flag(user: User) -> None:
    user.is_admin = user.role == ROLE_PLATFORM_ADMIN


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Требуется токен авторизации")
    token = authorization.removeprefix("Bearer ").strip()
    user_id = decode_access_token(token, settings)
    if user_id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Невалидный токен")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Пользователь не найден")
    if getattr(user, "status", "active") == "blocked":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Пользователь заблокирован")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Backward-compatible: PLATFORM_ADMIN or legacy is_admin."""
    if user.role != ROLE_PLATFORM_ADMIN and not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Требуются права администратора")
    return user


def require_platform_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != ROLE_PLATFORM_ADMIN and not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Требуется роль PLATFORM_ADMIN")
    return user


def require_moderator(user: User = Depends(get_current_user)) -> User:
    if user.role not in {ROLE_MODERATOR, ROLE_PLATFORM_ADMIN} and not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Требуются права модератора")
    return user


def require_role(*roles: str):
    allowed = set(roles) & PLATFORM_ROLES

    def _dep(user: User = Depends(get_current_user)) -> User:
        if user.is_admin and ROLE_PLATFORM_ADMIN in allowed:
            return user
        if user.role not in allowed:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Требуется одна из ролей: {sorted(allowed)}",
            )
        return user

    return _dep


def get_membership(db: Session, user: User, company_id: int) -> CompanyMember | None:
    return (
        db.query(CompanyMember)
        .filter(
            CompanyMember.company_id == company_id,
            CompanyMember.user_id == user.id,
            CompanyMember.status == MEMBER_STATUS_ACTIVE,
        )
        .first()
    )


def require_company_admin_member(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> tuple[User, Company]:
    """Owner or active COMPANY_ADMIN membership."""
    from .services import get_company_for_user

    company = get_company_for_user(db, user)
    if company is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Нет профиля компании")
    if company.user_id == user.id:
        return user, company
    if user.role == ROLE_PLATFORM_ADMIN or user.is_admin:
        return user, company
    member = get_membership(db, user, company.id)
    if member is None or member.member_role != MEMBER_ROLE_ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Требуются права администратора компании")
    return user, company
