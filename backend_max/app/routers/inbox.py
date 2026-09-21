from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import NotificationLog, User
from ..schemas import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def my_notifications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NotificationOut]:
    """Inbox уведомлений текущего пользователя (непрочитанные сверху)."""
    logs = (
        db.query(NotificationLog)
        .filter(NotificationLog.target_user_id == user.id)
        .order_by(NotificationLog.is_read.asc(), NotificationLog.created_at.desc())
        .limit(100)
        .all()
    )
    return [NotificationOut.model_validate(l) for l in logs]


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationOut:
    log = db.get(NotificationLog, notification_id)
    if log is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Уведомление не найдено")
    if log.target_user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Уведомление недоступно")
    log.is_read = True
    db.commit()
    return NotificationOut.model_validate(log)


@router.post("/read-all", response_model=dict)
def mark_all_read(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    db.query(NotificationLog).filter(
        NotificationLog.target_user_id == user.id,
        NotificationLog.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()
    return {"updated": True}
