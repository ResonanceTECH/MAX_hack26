from __future__ import annotations

import logging
import time
from typing import Any

from dotenv import load_dotenv

from api.max_api import MaxAPI

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("echo-bot")


def _chat_id_from_message(message: dict[str, Any]) -> int | None:
    recipient = message.get("recipient") or {}
    chat_id = recipient.get("chat_id")
    return int(chat_id) if chat_id is not None else None


def _user_id_from_message(message: dict[str, Any]) -> int | None:
    sender = message.get("sender") or {}
    user_id = sender.get("user_id")
    return int(user_id) if user_id is not None else None


def handle_update(api: MaxAPI, update: dict[str, Any]) -> None:
    update_type = update.get("update_type")

    if update_type == "bot_started":
        chat_id = update.get("chat_id")
        user_id = (update.get("user") or {}).get("user_id")
        text = "Эхо-бот. Напиши что угодно — верну то же самое."
        if chat_id is not None:
            api.send_message(text, chat_id=int(chat_id))
        elif user_id is not None:
            api.send_message(text, user_id=int(user_id))
        return

    if update_type != "message_created":
        return

    message = update.get("message") or {}
    text = (message.get("body") or {}).get("text")
    if not text:
        return

    # не отвечаем на свои же сообщения
    if (message.get("sender") or {}).get("is_bot"):
        return

    chat_id = _chat_id_from_message(message)
    user_id = _user_id_from_message(message)

    log.info("echo <- %r", text)
    if chat_id is not None:
        api.send_message(text, chat_id=chat_id)
    elif user_id is not None:
        api.send_message(text, user_id=user_id)


def start_bot() -> None:
    api = MaxAPI()
    me = api.get_me()
    name = me.get("first_name") or me.get("name") or "?"
    username = me.get("username") or "?"
    log.info("started as %s (@%s), user_id=%s", name, username, me.get("user_id"))

    marker: int | None = None
    while True:
        try:
            payload = api.get_updates(
                marker=marker,
                timeout=30,
                types=["message_created", "bot_started"],
            )
            marker = payload.get("marker", marker)
            for update in payload.get("updates") or []:
                try:
                    handle_update(api, update)
                except Exception:
                    log.exception("failed to handle update: %s", update)
        except KeyboardInterrupt:
            log.info("stopped")
            raise SystemExit(0) from None
        except Exception:
            log.exception("poll error, retry in 3s")
            time.sleep(3)


if __name__ == "__main__":
    start_bot()
