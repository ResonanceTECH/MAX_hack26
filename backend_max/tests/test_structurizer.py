from __future__ import annotations

from backend_max.app.structurizer import (
    parse_budget,
    parse_deadline_days,
    structure_request,
)


def test_parse_budget_up_to():
    assert parse_budget("бюджет до 150 тысяч рублей") == (None, 150_000)
    assert parse_budget("до 2 млн") == (None, 2_000_000)


def test_parse_budget_range():
    assert parse_budget("бюджет 400-600 тысяч") == (400_000, 600_000)
    assert parse_budget("от 100 до 300 тысяч рублей") == (100_000, 300_000)


def test_parse_budget_exact():
    assert parse_budget("бюджет 500к") == (400_000, 500_000)


def test_parse_deadline():
    assert parse_deadline_days("срок два месяца") == 60
    assert parse_deadline_days("нужно успеть за 30 дней") == 30
    assert parse_deadline_days("срок 2 недели") == 14


def test_structure_request_full():
    result = structure_request(
        "Нужна разработка интернет-магазина для производителя мебели. "
        "React, интеграция с 1С, бюджет 400-600 тысяч рублей, срок два месяца, Москва."
    )
    assert result["category"] == "IT-разработка"
    assert result["subcategory"] == "web-разработка"
    assert result["budget_min"] == 400_000
    assert result["budget_max"] == 600_000
    assert result["deadline_days"] == 60
    assert "Москва" in result["regions"]
    assert "react" in result["requirements"]
    assert "1с" in result["requirements"]


def test_structure_request_marketing():
    result = structure_request("Требуется smm-продвижение и контекстная реклама, бюджет до 150 тысяч, Самара")
    assert result["category"] == "Маркетинг и реклама"
    assert "Самара" in result["regions"]
    assert result["budget_max"] == 150_000


def test_structure_request_certificates():
    result = structure_request(
        "Нужен подрядчик по металлообработке с сертификатом ГОСТ 16371-2014, бюджет 200 тысяч"
    )
    assert result["category"] == "Производство"
    assert any("гост 16371-2014" in c for c in result["required_certificates"])
