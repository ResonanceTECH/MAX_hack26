from __future__ import annotations

import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..deps import get_current_user
from ..models import Company, Deal, Proposal, Request, UploadedFile, User
from ..schemas import FileOut
from ..services import require_company

router = APIRouter(prefix="/files", tags=["files"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 МБ


def _is_opportunity_participant(db: Session, request: Request, company: Company) -> bool:
    if request.company_id == company.id:
        return True
    return (
        db.query(Proposal)
        .filter(Proposal.request_id == request.id, Proposal.company_id == company.id)
        .first()
        is not None
    )


def _is_deal_participant(deal: Deal, company: Company) -> bool:
    return deal.customer_company_id == company.id or deal.executor_company_id == company.id


def _can_access_file(db: Session, uploaded: UploadedFile, user: User, company: Company) -> bool:
    if uploaded.owner_user_id == user.id or user.is_admin:
        return True
    if uploaded.deal_id:
        deal = db.get(Deal, uploaded.deal_id)
        if deal and _is_deal_participant(deal, company):
            return True
    if uploaded.opportunity_id:
        request = db.get(Request, uploaded.opportunity_id)
        if request and _is_opportunity_participant(db, request, company):
            return True
    return False


@router.post("", response_model=FileOut, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    opportunity_id: int | None = Form(default=None),
    deal_id: int | None = Form(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileOut:
    """Загрузка файла (до 10 МБ).

    Можно привязать к потребности (`opportunity_id`) или к сделке (`deal_id`)
    — тогда файл появится в Deal Room и будет доступен обеим сторонам.
    """
    settings = get_settings()
    os.makedirs(settings.files_dir, exist_ok=True)

    company = require_company(db, user)

    if deal_id is not None:
        deal = db.get(Deal, deal_id)
        if deal is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Сделка не найдена")
        if not _is_deal_participant(deal, company):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Вы не участник сделки")
        opportunity_id = opportunity_id or deal.opportunity_id
    if opportunity_id is not None:
        request = db.get(Request, opportunity_id)
        if request is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Потребность не найдена")
        if not _is_opportunity_participant(db, request, company):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Вы не участник потребности")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Файл больше 10 МБ")

    storage_name = f"{uuid.uuid4().hex}_{os.path.basename(file.filename or 'file')}"
    storage_path = os.path.join(settings.files_dir, storage_name)
    with open(storage_path, "wb") as fh:
        fh.write(content)

    uploaded = UploadedFile(
        owner_user_id=user.id,
        name=file.filename or storage_name,
        content_type=file.content_type,
        size=len(content),
        storage_path=storage_path,
        opportunity_id=opportunity_id,
        deal_id=deal_id,
    )
    db.add(uploaded)
    db.commit()
    db.refresh(uploaded)
    return FileOut.model_validate(uploaded)


@router.get("/{file_id}")
def download_file(
    file_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    """Скачивание файла (владелец, админ или участник привязанной сделки/потребности)."""
    uploaded = db.get(UploadedFile, file_id)
    if uploaded is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    company = require_company(db, user)
    if not _can_access_file(db, uploaded, user, company):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Файл недоступен")
    if not os.path.exists(uploaded.storage_path):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл отсутствует на диске")
    return FileResponse(
        uploaded.storage_path,
        media_type=uploaded.content_type or "application/octet-stream",
        filename=uploaded.name,
    )
