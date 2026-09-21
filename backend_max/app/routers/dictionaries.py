from __future__ import annotations

from fastapi import APIRouter

from ..schemas import CategoryOut, DictionariesOut
from ..structurizer import CATEGORIES, REGIONS

router = APIRouter(prefix="/dictionaries", tags=["dictionaries"])


@router.get("", response_model=DictionariesOut)
def get_dictionaries() -> DictionariesOut:
    """Справочники для форм мини-приложения: категории, регионы, пресеты."""
    return DictionariesOut(
        categories=[CategoryOut(name=name, services=cfg["services"]) for name, cfg in CATEGORIES.items()],
        regions=REGIONS,
        budget_ranges=[
            {"id": "up_to_100k", "label": "до 100 000 ₽", "min": None, "max": 100_000},
            {"id": "100k_500k", "label": "100–500 тыс. ₽", "min": 100_000, "max": 500_000},
            {"id": "500k_2m", "label": "0,5–2 млн ₽", "min": 500_000, "max": 2_000_000},
            {"id": "over_2m", "label": "более 2 млн ₽", "min": 2_000_000, "max": None},
        ],
        deadline_presets=[
            {"id": "week", "label": "до 1 недели", "days": 7},
            {"id": "two_weeks", "label": "до 2 недель", "days": 14},
            {"id": "month", "label": "до 1 месяца", "days": 30},
            {"id": "two_months", "label": "до 2 месяцев", "days": 60},
            {"id": "quarter", "label": "до 3 месяцев", "days": 90},
        ],
    )


@router.get("/categories", response_model=list[CategoryOut])
def get_categories() -> list[CategoryOut]:
    return [CategoryOut(name=name, services=cfg["services"]) for name, cfg in CATEGORIES.items()]


@router.get("/regions", response_model=list[str])
def get_regions() -> list[str]:
    return REGIONS
