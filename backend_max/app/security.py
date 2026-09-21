from __future__ import annotations

import hashlib
import hmac
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qsl

import jwt

from .config import Settings


def parse_init_data(init_data: str) -> dict[str, str]:
    """Разбирает строку initData вида 'key=value&key2=value2'."""
    return dict(parse_qsl(init_data, keep_blank_values=True))


def verify_init_data(init_data: str, bot_token: str, max_age: int = 86400) -> dict | None:
    """Проверяет подпись initData мини-приложения MAX.

    Алгоритм совместим со схемой WebApp initData (HMAC-SHA256 с секретом
    HMAC-SHA256(b"WebAppData", bot_token)). Перед продакшеном сверьте
    точный порядок полей с актуальной документацией MAX Bridge.
    Возвращает распарсенные данные или None, если подпись невалидна.
    """
    if not bot_token or not init_data:
        return None
    data = parse_init_data(init_data)
    received_hash = data.pop("hash", None)
    if not received_hash:
        return None
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    calculated = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(calculated, received_hash):
        return None
    auth_date = data.get("auth_date")
    if auth_date and auth_date.isdigit():
        if int(time.time()) - int(auth_date) > max_age:
            return None
    return data


def init_data_to_user_fields(data: dict) -> dict:
    """Достаёт поля пользователя из initDataUnsafe.user."""
    user = data.get("user")
    if isinstance(user, str):
        import json

        try:
            user = json.loads(user)
        except json.JSONDecodeError:
            user = None
    user = user or {}
    return {
        "max_user_id": int(user.get("id") or 0),
        "first_name": user.get("first_name") or data.get("first_name"),
        "last_name": user.get("last_name"),
        "username": user.get("username"),
    }


def create_access_token(user_id: int, settings: Settings) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_ttl_hours)
    payload = {"sub": str(user_id), "exp": expires}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str, settings: Settings) -> int | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
