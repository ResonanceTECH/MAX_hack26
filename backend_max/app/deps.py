from __future__ import annotations

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .db import get_db
from .models import Company, CompanyMember, User
from .permissions import (
    BUSINESS_USER_PERMISSIONS,
    COMPANY_ROLE_PERMISSIONS,
    STAFF_ROLES,
    company_role_has_permission,
)
from .roles import (
    MEMBER_ROLE_ADMIN,
    MEMBER_STATUS_ACTIVE,
    PLATFORM_ROLES,
    ROLE_BUSINESS_USER,
    ROLE_COMPANY_ADMIN,
    ROLE_MODERATOR,
    ROLE_PLATFORM_ADMIN,
)
from .security import decode_access_token

settings: Settings = get_settings()

# пути, доступные приостановленным пользователям (вход и служебное)
SUSPENDED_EXEMPT_PATHS = {"/auth/max", "/api/auth/init"}
MUTATION_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def sync_admin_flag(user: User) -> None:
    user.is_admin = user.role == ROLE_PLATFORM_ADMIN


def get_current_user(
    request: Request,
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

    user_status = (getattr(user, "status", "active") or "active").lower()
    if user_status == "blocked":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Пользователь заблокирован")
    if user_status == "suspended":
        # чтение разрешено, изменения — нет
        if request.method in MUTATION_METHODS and request.url.path not in SUSPENDED_EXEMPT_PATHS:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Аккаунт приостановлен: изменения недоступны, доступен только просмотр",
            )
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
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


def get_active_membership(db: Session, user: User) -> CompanyMember | None:
    return (
        db.query(CompanyMember)
        .filter(
            CompanyMember.user_id == user.id,
            CompanyMember.status == MEMBER_STATUS_ACTIVE,
        )
        .first()
    )


def resolve_member_role(db: Session, user: User, company: Company) -> str | None:
    if user.role in STAFF_ROLES or user.is_admin:
        return None
    member = get_membership(db, user, company.id)
    if member is not None:
        return member.member_role
    if company.user_id == user.id and user.role == ROLE_COMPANY_ADMIN:
        return MEMBER_ROLE_ADMIN
    return None


def user_has_company_permission(db: Session, user: User, company: Company, permission: str) -> bool:
    if user.role in STAFF_ROLES or user.is_admin:
        return False
    member_role = resolve_member_role(db, user, company)
    if member_role:
        return company_role_has_permission(member_role, permission)

    if user.role == ROLE_BUSINESS_USER:
        return permission in BUSINESS_USER_PERMISSIONS
    if user.role == ROLE_COMPANY_ADMIN:

        if company.user_id == user.id:
            return permission in COMPANY_ROLE_PERMISSIONS[MEMBER_ROLE_ADMIN]
    return False


def require_company_permission(db: Session, user: User, permission: str) -> Company:
    from .services import get_company_for_user, is_company_active

    company = get_company_for_user(db, user)
    if company is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Нет профиля компании")
    if not is_company_active(company):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Компания заблокирована или приостановлена: операции недоступны",
        )
    if not user_has_company_permission(db, user, company, permission):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    return company


def require_company_admin_member(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> tuple[User, Company]:
    from .permissions import PERM_MANAGE_COMPANY_MEMBERS
    from .services import get_company_for_user

    company = get_company_for_user(db, user)
    if company is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Нет профиля компании")
    if not user_has_company_permission(db, user, company, PERM_MANAGE_COMPANY_MEMBERS):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Требуются права администратора компании")
    return user, company
