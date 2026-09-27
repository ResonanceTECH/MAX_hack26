from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() not in {"", "0", "false", "no"}


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


def _env_list(name: str) -> list[str]:
    raw = os.getenv(name, "")
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass
class Settings:
    bot_token: str = ""
    jwt_secret: str = "change_me"
    jwt_ttl_hours: int = 168
    database_url: str = "postgresql+psycopg2://b2b:b2b_pass@localhost:5432/b2b_match"
    max_ssl_verify: bool = True
    dev_mode: bool = False
    initdata_max_age: int = 86400
    min_match_score: int = 60
    top_matches: int = 5
    admin_user_ids: list[int] = field(default_factory=list)
    llm_api_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""
    files_dir: str = "./data/files"

    def __post_init__(self) -> None:
        self.bot_token = os.getenv("BOT_TOKEN", "")
        self.jwt_secret = os.getenv("JWT_SECRET", "change_me")
        self.jwt_ttl_hours = _env_int("JWT_TTL_HOURS", 168)
        self.database_url = os.getenv(
            "DATABASE_URL", "postgresql+psycopg2://b2b:b2b_pass@localhost:5432/b2b_match"
        )
        # MAX_SSL_VERIFY=0 -> не проверять сертификат (сертификат Минцифры)
        self.max_ssl_verify = not _env_bool("MAX_SSL_VERIFY", False)
        self.dev_mode = _env_bool("DEV_MODE", not bool(self.bot_token))
        self.initdata_max_age = _env_int("INITDATA_MAX_AGE", 86400)
        self.min_match_score = _env_int("MIN_MATCH_SCORE", 60)
        self.top_matches = _env_int("TOP_MATCHES", 5)
        self.admin_user_ids = [int(i) for i in _env_list("MAX_ADMIN_USER_IDS") if i.isdigit()]
        self.llm_api_key = os.getenv("LLM_API_KEY", "") or os.getenv("OPENROUTER_API_KEY", "")
        self.llm_api_url = os.getenv("LLM_API_URL", "") or (
            "https://openrouter.ai/api/v1" if self.llm_api_key else ""
        )
        self.llm_model = os.getenv("LLM_MODEL", "") or (
            "nvidia/nemotron-3-super-120b-a12b:free" if self.llm_api_key else ""
        )
        self.files_dir = os.getenv("FILES_DIR", "./data/files")


@lru_cache
def get_settings() -> Settings:
    return Settings()
