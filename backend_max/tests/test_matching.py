from __future__ import annotations

from backend_max.app.matching import WEIGHTS, match_company
from backend_max.app.models import Company, Request


def _request(**overrides) -> Request:
    data = dict(
        title="Разработка интернет-магазина",
        description_raw="Нужен интернет-магазин",
        category="IT-разработка",
        subcategory="web-разработка",
        requirements=["react", "1с"],
        required_certificates=["ГОСТ 16371-2014"],
        budget_min=400_000,
        budget_max=600_000,
        deadline_days=60,
        regions=["Москва"],
        proposals_deadline_days=14,
        status="published",
    )
    data.update(overrides)
    return Request(**data)


def _company(**overrides) -> Company:
    data = dict(
        name="DigitalLab",
        industries=["IT-разработка"],
        services=["web-разработка"],
        competencies=["react", "python", "1с"],
        regions=["Москва"],
        budget_min=300_000,
        budget_max=1_000_000,
        max_term_days=45,
        is_verified=True,
        cases=[{"title": "Интернет-магазин мебели", "description": "React + 1С, поэтапная сдача"}],
        certificates=["ГОСТ 16371-2014"],
    )
    data.update(overrides)
    return Company(**data)


def test_weights_sum_to_100():
    assert sum(WEIGHTS.values()) == 100


def test_full_match():
    score, criteria = match_company(_request(), _company())
    assert score == 100
    assert all(c.passed for c in criteria)


def test_explainable_miss():
    request = _request(regions=["Казань"], deadline_days=10)
    company = _company(max_term_days=30, is_verified=False)
    score, criteria = match_company(request, company)
    assert score < 100
    by_key = {c.key: c for c in criteria}
    assert by_key["region"].passed is False
    assert "Казань" in by_key["region"].detail
    assert by_key["deadline"].passed is False
    assert by_key["verified"].passed is False


def test_budget_mismatch():
    request = _request(budget_min=2_000_000, budget_max=3_000_000)
    score, criteria = match_company(request, _company())
    by_key = {c.key: c for c in criteria}
    assert by_key["budget"].passed is False
    assert score < 100


def test_requirements_partial():
    request = _request(requirements=["react", "1с", "kotlin"])
    score, criteria = match_company(request, _company())
    by_key = {c.key: c for c in criteria}
    # 2 из 3 >= 50% — критерий пройден, но с объяснением
    assert by_key["requirements"].passed is True
    assert "2/3" in by_key["requirements"].detail


def test_missing_certificate():
    request = _request(required_certificates=["ISO 9001"])
    score, criteria = match_company(request, _company())
    by_key = {c.key: c for c in criteria}
    assert by_key["certificate"].passed is False
    assert "iso 9001" in by_key["certificate"].detail
    assert score == 100 - WEIGHTS["certificate"]


def test_certificate_not_required():
    request = _request(required_certificates=[])
    _, criteria = match_company(request, _company())
    by_key = {c.key: c for c in criteria}
    assert by_key["certificate"].passed is True
    assert "не требуются" in by_key["certificate"].detail


def test_cases_criterion():
    _, criteria = match_company(_request(), _company())
    by_key = {c.key: c for c in criteria}
    assert by_key["cases"].passed is True
    assert "1 из 1" in by_key["cases"].detail

    company_no_cases = _company(cases=[])
    _, criteria = match_company(_request(), company_no_cases)
    by_key = {c.key: c for c in criteria}
    assert by_key["cases"].passed is False
    assert "нет кейсов" in by_key["cases"].detail
