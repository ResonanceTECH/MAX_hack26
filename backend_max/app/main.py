from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import init_db
from .routers import (
    admin,
    auth,
    companies,
    company_workspace,
    deals,
    dictionaries,
    favorites,
    feed,
    files,
    inbox,
    moderation,
    opportunities,
    platform_admin,
    proposals,
    share,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("b2b-match")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ретраи подключения: PostgreSQL в compose поднимается параллельно
    for attempt in range(1, 11):
        try:
            init_db()
            break
        except Exception:
            if attempt == 10:
                raise
            log.warning("db not ready (attempt %d/10), retry in 2s", attempt)
            await asyncio.sleep(2)
    log.info(
        "B2B Match backend started (dev_mode=%s, bot_token=%s, db=%s)",
        settings.dev_mode,
        "set" if settings.bot_token else "NOT SET",
        settings.database_url,
    )
    yield


app = FastAPI(
    title="B2B Match API",
    description=(
        "Бэкенд мини-приложения B2B Match в MAX: подбор B2B-контрагентов "
        "по бизнес-потребности. Профили компаний, структурированные запросы, "
        "объяснимый матчинг, отклики, сравнение, shortlist и Deal Room."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")
api.include_router(auth.router)
api.include_router(companies.router)
api.include_router(company_workspace.router)
api.include_router(opportunities.router)
api.include_router(proposals.router)
api.include_router(deals.router)
api.include_router(feed.router)
api.include_router(files.router)
api.include_router(inbox.router)
api.include_router(share.router)
api.include_router(dictionaries.router)
api.include_router(favorites.router)
api.include_router(moderation.router)
api.include_router(platform_admin.router)
api.include_router(admin.router)


@api.get("/health", tags=["meta"])
def api_health() -> dict:
    return {"status": "ok"}


app.include_router(api)


@app.get("/", tags=["meta"])
def root() -> dict:
    return {
        "service": "B2B Match API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
        "api": "/api",
    }


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
