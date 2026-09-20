from __future__ import annotations

import os
import warnings
from typing import Any

import requests
from urllib3.exceptions import InsecureRequestWarning


class MaxAPI:
    """Тонкий клиент к platform-api2.max.ru."""

    BASE_URL = "https://platform-api2.max.ru"

    def __init__(
        self,
        token: str | None = None,
        *,
        verify_ssl: bool | None = None,
        timeout: float = 35.0,
    ) -> None:
        self.token = token or os.getenv("BOT_TOKEN", "")
        if not self.token:
            raise ValueError("BOT_TOKEN не задан")

        if verify_ssl is None:
            verify_ssl = os.getenv("MAX_SSL_VERIFY", "0") not in {"0", "false", "False"}
        self.verify_ssl = verify_ssl
        if not self.verify_ssl:
            warnings.filterwarnings("ignore", category=InsecureRequestWarning)
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": self.token,
                "Content-Type": "application/json",
            }
        )

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
        timeout: float | None = None,
    ) -> dict[str, Any]:
        response = self.session.request(
            method,
            f"{self.BASE_URL}{path}",
            params=params,
            json=json,
            timeout=timeout or self.timeout,
            verify=self.verify_ssl,
        )
        response.raise_for_status()
        if not response.content:
            return {}
        return response.json()

    def get_me(self) -> dict[str, Any]:
        return self._request("GET", "/me")

    def get_updates(
        self,
        *,
        marker: int | None = None,
        limit: int = 100,
        timeout: int = 30,
        types: list[str] | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"limit": limit, "timeout": timeout}
        if marker is not None:
            params["marker"] = marker
        if types:
            params["types"] = ",".join(types)
        # long poll: ждём до timeout сек + запас
        return self._request(
            "GET",
            "/updates",
            params=params,
            timeout=timeout + 10,
        )

    def send_message(
        self,
        text: str,
        *,
        chat_id: int | None = None,
        user_id: int | None = None,
        **extra: Any,
    ) -> dict[str, Any]:
        if chat_id is None and user_id is None:
            raise ValueError("Нужен chat_id или user_id")
        params: dict[str, Any] = {}
        if chat_id is not None:
            params["chat_id"] = chat_id
        if user_id is not None:
            params["user_id"] = user_id
        body = {"text": text, **extra}
        return self._request("POST", "/messages", params=params, json=body)
