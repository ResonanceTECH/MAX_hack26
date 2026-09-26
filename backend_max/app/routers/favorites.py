from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Favorite, User
from ..schemas import FavoriteOut, FavoriteToggleIn, FavoriteToggleOut

router = APIRouter(prefix="/favorites", tags=["favorites"])


def _out(fav: Favorite) -> FavoriteOut:
    return FavoriteOut(
        id=fav.id,
        type=fav.target_type,
        target_id=fav.target_id,
        created_at=fav.created_at,
    )


@router.get("", response_model=list[FavoriteOut])
def list_favorites(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[FavoriteOut]:
    rows = (
        db.query(Favorite)
        .filter(Favorite.user_id == user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )
    return [_out(r) for r in rows]


@router.post("/toggle", response_model=FavoriteToggleOut)
def toggle_favorite(
    payload: FavoriteToggleIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FavoriteToggleOut:
    if payload.type not in {"company", "opportunity"}:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "type: company|opportunity")
    existing = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == user.id,
            Favorite.target_type == payload.type,
            Favorite.target_id == payload.target_id,
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return FavoriteToggleOut(favorited=False, item=None)
    fav = Favorite(user_id=user.id, target_type=payload.type, target_id=payload.target_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return FavoriteToggleOut(favorited=True, item=_out(fav))


@router.get("/check", response_model=dict)
def check_favorite(
    type: str,
    target_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    exists = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == user.id,
            Favorite.target_type == type,
            Favorite.target_id == target_id,
        )
        .first()
        is not None
    )
    return {"favorited": exists}
