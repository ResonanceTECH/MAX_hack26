from __future__ import annotations

from dataclasses import dataclass

from .models import Company, Request
from .structurizer import normalize

# Веса критериев (в сумме 100)
WEIGHTS = {
    "category": 25,
    "subcategory": 10,
    "requirements": 20,
    "budget": 15,
    "region": 10,
    "deadline": 5,
    "verified": 5,
    "cases": 5,
    "certificate": 5,
}


@dataclass
class Criterion:
    key: str
    label: str
    passed: bool
    detail: str

    def as_dict(self) -> dict:
        return {"key": self.key, "label": self.label, "passed": self.passed, "detail": self.detail}


def _overlap(request_terms: list[str], company_terms: list[str]) -> tuple[list[str], int, int]:
    company_set = {normalize(t) for t in company_terms if t}
    matched = [t for t in request_terms if normalize(t) in company_set]
    return matched, len(matched), len(request_terms)


def _budget_fits(request: Request, company: Company) -> tuple[bool, str]:
    rmin, rmax = request.budget_min, request.budget_max
    cmin, cmax = company.budget_min, company.budget_max
    if rmin is None and rmax is None:
        return True, "бюджет не указан — критерий не применяется"
    if cmin is None and cmax is None:
        return False, "у компании не заполнен ценовой диапазон"
    low = cmin if cmin is not None else 0
    high = cmax if cmax is not None else float("inf")
    if rmin is not None and rmin > (high or float("inf")):
        return False, f"бюджет запроса от {rmin} ₽ выше верхней границы компании"
    if rmax is not None and (low or 0) > rmax:
        return False, f"бюджет запроса до {rmax} ₽ ниже нижней границы компании"
    return True, "бюджетные диапазоны пересекаются"


def _case_matches(request_terms: set[str], case: dict) -> bool:
    if not request_terms:
        return True
    text = normalize(" ".join([case.get("title", ""), case.get("description", "")]))
    return any(term in text for term in request_terms)


def match_company(request: Request, company: Company) -> tuple[int, list[Criterion]]:
    criteria: list[Criterion] = []
    score = 0

    # категория
    category_ok = bool(request.category) and request.category in (company.industries or [])
    criteria.append(
        Criterion(
            "category",
            "Отрасль",
            category_ok,
            f"запрос: {request.category}; компания: {company.industries or 'не указана'}",
        )
    )
    if category_ok:
        score += WEIGHTS["category"]
    elif not company.industries:
        criteria[-1].detail = "у компании не указаны отрасли"

    # подкатегория / услуга
    if request.subcategory:
        sub_ok = normalize(request.subcategory) in {normalize(s) for s in company.services}
        criteria.append(
            Criterion(
                "subcategory",
                "Услуга",
                sub_ok,
                f"нужна услуга «{request.subcategory}»"
                + ("" if sub_ok else f", у компании услуги: {company.services or 'не указаны'}"),
            )
        )
        if sub_ok:
            score += WEIGHTS["subcategory"]
    else:
        criteria.append(Criterion("subcategory", "Услуга", True, "подкатегория не указана"))
        score += WEIGHTS["subcategory"]

    # компетенции / требования
    matched, cnt, total = _overlap(request.requirements, list(company.competencies) + list(company.services))
    req_ok = total == 0 or (cnt / total) >= 0.5
    detail = (
        f"совпадение компетенций {cnt}/{total}: {matched or '—'}"
        if total
        else "требования не указаны — критерий не применяется"
    )
    criteria.append(Criterion("requirements", "Компетенции и требования", req_ok, detail))
    if req_ok:
        score += WEIGHTS["requirements"]

    # бюджет
    budget_ok, budget_detail = _budget_fits(request, company)
    criteria.append(Criterion("budget", "Бюджет", budget_ok, budget_detail))
    if budget_ok:
        score += WEIGHTS["budget"]

    # регион
    request_regions = set(request.regions or [])
    company_regions = set(company.regions or [])
    if request_regions:
        region_ok = bool(request_regions & company_regions) or "Вся Россия" in company_regions
        criteria.append(
            Criterion(
                "region",
                "География",
                region_ok,
                f"нужны регионы: {sorted(request_regions)}; у компании: {sorted(company_regions) or 'не указаны'}",
            )
        )
        if region_ok:
            score += WEIGHTS["region"]
    else:
        criteria.append(Criterion("region", "География", True, "регион не указан — критерий не применяется"))
        score += WEIGHTS["region"]

    # сроки
    if request.deadline_days and company.max_term_days:
        deadline_ok = company.max_term_days <= request.deadline_days
        criteria.append(
            Criterion(
                "deadline",
                "Сроки",
                deadline_ok,
                f"нужно ≤ {request.deadline_days} дн., компания берётся за ≤ {company.max_term_days} дн.",
            )
        )
        if deadline_ok:
            score += WEIGHTS["deadline"]
    else:
        criteria.append(Criterion("deadline", "Сроки", True, "сроки не сопоставимы — критерий не применяется"))
        score += WEIGHTS["deadline"]

    # верификация
    if company.is_verified:
        criteria.append(Criterion("verified", "Проверенный профиль", True, "профиль компании верифицирован"))
        score += WEIGHTS["verified"]
    else:
        criteria.append(Criterion("verified", "Проверенный профиль", False, "профиль не верифицирован"))

    # похожие кейсы
    request_terms = {normalize(t) for t in request.requirements if t}
    cases = company.cases or []
    relevant_cases = [c for c in cases if isinstance(c, dict) and _case_matches(request_terms, c)]
    if cases:
        cases_ok = len(relevant_cases) >= 1
        cases_detail = f"релевантные кейсы: {len(relevant_cases)} из {len(cases)}"
        if cases_ok and relevant_cases:
            cases_detail += f" (например: {relevant_cases[0].get('title', '')})"
    else:
        cases_ok = False
        cases_detail = "у компании нет кейсов в профиле"
    criteria.append(Criterion("cases", "Похожие кейсы", cases_ok, cases_detail))
    if cases_ok:
        score += WEIGHTS["cases"]

    # сертификаты
    required = {normalize(c) for c in (request.required_certificates or []) if c}
    company_certs = {normalize(c) for c in (company.certificates or []) if c}
    if required:
        missing = required - company_certs
        cert_ok = not missing
        if cert_ok:
            cert_detail = f"все требуемые сертификаты есть: {sorted(required)}"
        else:
            cert_detail = f"нет требуемых сертификатов: {sorted(missing)} (у компании: {sorted(company_certs) or '—'})"
    else:
        cert_ok = True
        cert_detail = "сертификаты не требуются — критерий не применяется"
    criteria.append(Criterion("certificate", "Сертификаты", cert_ok, cert_detail))
    if cert_ok:
        score += WEIGHTS["certificate"]

    return score, criteria
