from __future__ import annotations

import logging
import warnings

import requests
from urllib3.exceptions import InsecureRequestWarning

from .config import get_settings
from .db import SessionLocal
from .models import NotificationLog, User

log = logging.getLogger("b2b-match.notify")

BASE_URL = "https://platform-api2.max.ru"


class Notifier:
    """Отправляет уведомления пользователям через Bot API MAX.

    Все вызовы best-effort: ошибки не роняют основной сценарий,
    результат фиксируется в NotificationLog (одновременно это inbox
    пользователя — GET /notifications).
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        self.token = self.settings.bot_token
        self.session = requests.Session()
        self.session.headers.update(
            {"Authorization": self.token, "Content-Type": "application/json"}
        )
        if not self.settings.max_ssl_verify:
            warnings.filterwarnings("ignore", category=InsecureRequestWarning)

    @property
    def enabled(self) -> bool:
        return bool(self.token)

    def send(self, user: User | None, text: str) -> bool:
        db = SessionLocal()
        try:
            entry = NotificationLog(
                user_id=user.max_user_id if user else None,
                target_user_id=user.id if user else None,
                text=text,
            )
            if not self.enabled:
                entry.ok = False
                entry.error = "BOT_TOKEN не задан — уведомление только в журнале"
                db.add(entry)
                db.commit()
                return False
            try:
                response = self.session.post(
                    f"{BASE_URL}/messages",
                    params={"user_id": user.max_user_id} if user else None,
                    json={"text": text},
                    timeout=15,
                    verify=self.settings.max_ssl_verify,
                )
                response.raise_for_status()
                entry.ok = True
                db.add(entry)
                db.commit()
                return True
            except Exception as exc:  # noqa: BLE001
                entry.ok = False
                entry.error = str(exc)[:500]
                db.add(entry)
                db.commit()
                log.warning("notify failed for user=%s: %s", user.max_user_id if user else None, exc)
                return False
        finally:
            db.close()

    # ---------- шаблоны событий ----------

    def send_and_get_mid(self, user: User, text: str) -> str | None:
        """Отправляет сообщение и возвращает его id (mid) для shareMaxContent.

        Возвращает None, если токен не задан или отправка не удалась.
        """
        if not self.enabled or user is None:
            return None
        try:
            response = self.session.post(
                f"{BASE_URL}/messages",
                params={"user_id": user.max_user_id},
                json={"text": text},
                timeout=15,
                verify=self.settings.max_ssl_verify,
            )
            response.raise_for_status()
            body = response.json()
            message = body.get("message") or {}
            return (
                body.get("mid")
                or body.get("message_id")
                or message.get("mid")
                or message.get("id")
            )
        except Exception as exc:  # noqa: BLE001
            log.warning("share send failed for user=%s: %s", user.max_user_id, exc)
            return None

    def proposal_received(self, user: User | None, request_title: str, company_name: str) -> None:
        self.send(user, f"📩 На ваш запрос «{request_title}» поступило предложение от {company_name}.")

    def new_request_match(self, user: User | None, request_title: str, score: int) -> None:
        self.send(user, f"🎯 Вам подошёл новый заказ на {score}%: «{request_title}».")

    def added_to_shortlist(self, user: User | None, request_title: str) -> None:
        self.send(user, f"⭐ Вас добавили в shortlist по запросу «{request_title}».")

    def chosen_as_executor(self, user: User | None, request_title: str) -> None:
        self.send(user, f"🎉 Поздравляем! Вы выбраны исполнителем по запросу «{request_title}». Начните переговоры.")

    def rejected(self, user: User | None, request_title: str) -> None:
        self.send(user, f"По запросу «{request_title}» заказчик выбрал другого исполнителя.")

    def negotiation_started(self, user: User | None, request_title: str) -> None:
        self.send(user, f"🤝 Заказчик открыл переговоры по запросу «{request_title}» (Deal Room).")

    def deadline_reminder(self, user: User | None, request_title: str, days_left: int) -> None:
        self.send(user, f"⏰ До окончания приёма предложений по запросу «{request_title}» осталось {days_left} дн.")


notifier = Notifier()
