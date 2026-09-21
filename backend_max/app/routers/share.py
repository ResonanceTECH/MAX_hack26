from __future__ import annotations

from urllib.parse import quote

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Company, Request, User
from ..notifications import notifier
from ..schemas import ShareLinkOut, ShareOut
from ..services import get_company_or_404, get_request_or_404

router = APIRouter(prefix="/share", tags=["share"])

SHARE_DEEPLINK = "https://max.ru/:share?text="


def _company_card(company: Company) -> str:
    budget = "не указан"
    if company.budget_min or company.budget_max:
        budget = f"{company.budget_min or 0:,} – {company.budget_max or '∞'} ₽".replace(",", " ")
    verified = "✅ профиль верифицирован" if company.is_verified else "профиль не верифицирован"
    return (
        f"🏢 {company.name}\n"
        f"Отрасли: {', '.join(company.industries) or '—'}\n"
        f"Услуги: {', '.join(company.services) or '—'}\n"
        f"Регионы: {', '.join(company.regions) or '—'}\n"
        f"Бюджет: {budget}\n"
        f"{verified}\n\n"
        f"Найдено в B2B Match"
    )


def _opportunity_card(request: Request, db: Session) -> str:
    author = db.get(Company, request.company_id)
    budget = "не указан"
    if request.budget_min or request.budget_max:
        budget = f"{request.budget_min or 0:,} – {request.budget_max or '∞'} ₽".replace(",", " ")
    deadline = f"{request.deadline_days} дн." if request.deadline_days else "не указан"
    return (
        f"📋 {request.title}\n"
        f"Категория: {request.category}\n"
        f"Бюджет: {budget}\n"
        f"Срок: {deadline}\n"
        f"Регион: {', '.join(request.regions) or '—'}\n"
        f"Компания: {author.name if author else '—'}\n\n"
        f"Найдено в B2B Match"
    )


@router.post("/company/{company_id}", response_model=ShareOut)
def share_company_card(
    company_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShareOut:
    """Отправляет карточку компании пользователю через бота.

    Возвращает mid — фронтенд вызывает window.WebApp.shareMaxContent({mid, chatType}),
    и пользователь пересылает карточку в выбранный чат MAX.
    """
    company = get_company_or_404(db, company_id)
    text = _company_card(company)
    if not notifier.enabled:
        return ShareOut(sent=False, text=text, error="BOT_TOKEN не задан — шеринг недоступен")
    mid = notifier.send_and_get_mid(user, text)
    if mid is None:
        return ShareOut(sent=False, text=text, error="Не удалось отправить сообщение через Bot API")
    return ShareOut(sent=True, mid=mid, text=text)


@router.get("/company/{company_id}/link", response_model=ShareLinkOut)
def share_company_link(company_id: int, db: Session = Depends(get_db)) -> ShareLinkOut:
    """Ссылка «Отправить в MAX» (диплинк :share) с текстом карточки компании."""
    company = get_company_or_404(db, company_id)
    return ShareLinkOut(url=SHARE_DEEPLINK + quote(_company_card(company)))


@router.post("/opportunity/{opportunity_id}", response_model=ShareOut)
def share_opportunity_card(
    opportunity_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShareOut:
    """Отправляет карточку потребности пользователю через бота (для shareMaxContent)."""
    request = get_request_or_404(db, opportunity_id)
    text = _opportunity_card(request, db)
    if not notifier.enabled:
        return ShareOut(sent=False, text=text, error="BOT_TOKEN не задан — шеринг недоступен")
    mid = notifier.send_and_get_mid(user, text)
    if mid is None:
        return ShareOut(sent=False, text=text, error="Не удалось отправить сообщение через Bot API")
    return ShareOut(sent=True, mid=mid, text=text)


@router.get("/opportunity/{opportunity_id}/link", response_model=ShareLinkOut)
def share_opportunity_link(opportunity_id: int, db: Session = Depends(get_db)) -> ShareLinkOut:
    """Ссылка «Отправить в MAX» (диплинк :share) с текстом карточки потребности."""
    request = get_request_or_404(db, opportunity_id)
    return ShareLinkOut(url=SHARE_DEEPLINK + quote(_opportunity_card(request, db)))
