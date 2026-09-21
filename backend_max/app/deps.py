from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .db import get_db
from .models import User
from .security import decode_access_token

settings: Settings = get_settings()


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
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Требуются права администратора")
    return user
