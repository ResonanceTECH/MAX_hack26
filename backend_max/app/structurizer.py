from __future__ import annotations

import json
import re

import requests

from .config import Settings

# ---------- справочники категорий ----------

CATEGORIES: dict[str, dict] = {
    "IT-разработка": {
        "keywords": [
            "разработк", "сайт", "интернет-магазин", "приложение", "приложени", "портал",
            "сервис", "платформ", "crm", "автоматизац", "интеграц", "1с",
            "api", "frontend", "backend", "react", "vue", "python", "javascript",
            "мобильн", "telegram", "чат-бот", "saas",
        ],
        "services": ["web-разработка", "мобильная разработка", "интеграции", "автоматизация"],
        "subcategories": {
            "мобильн": "мобильная разработка",
            "интернет-магазин": "web-разработка",
            "сайт": "web-разработка",
            "портал": "web-разработка",
            "1с": "интеграции",
            "интеграц": "интеграции",
            "crm": "автоматизация",
            "автоматизац": "автоматизация",
            "чат-бот": "автоматизация",
        },
    },
    "Маркетинг и реклама": {
        "keywords": [
            "маркетинг", "реклам", "smm", "продвижен", "контекстн", "таргет",
            "бренд", "лидогенерац", "seo", "контент",
        ],
        "services": ["smm-продвижение", "контекстная реклама", "seo", "брендинг"],
        "subcategories": {
            "smm": "smm-продвижение",
            "контекстн": "контекстная реклама",
            "seo": "seo",
            "бренд": "брендинг",
        },
    },
    "Производство": {
        "keywords": [
            "производств", "изготовлени", "мебел", "упаковк", "металлообработк",
            "детал", "поставщик", "поставк", "сырь", "печатн", "полиграфи",
            "оборудован", "производственн",
        ],
        "services": ["мебель на заказ", "упаковка", "металлообработка", "полиграфия", "поставка сырья"],
        "subcategories": {
            "мебел": "мебель на заказ",
            "упаковк": "упаковка",
            "металлообработк": "металлообработка",
            "полиграфи": "полиграфия",
            "печатн": "полиграфия",
        },
    },
    "Логистика": {
        "keywords": ["логистик", "доставк", "перевозк", "груз", "склад", "фулфилмент", "курьер"],
        "services": ["доставка по городу", "грузоперевозки", "фулфилмент", "складские услуги"],
        "subcategories": {
            "фулфилмент": "фулфилмент",
            "склад": "складские услуги",
            "груз": "грузоперевозки",
        },
    },
    "Строительство и ремонт": {
        "keywords": ["строит", "ремонт", "отделк", "монтаж", "фасад", "проектирован"],
        "services": ["строительство", "ремонт помещений", "отделочные работы", "проектирование"],
        "subcategories": {},
    },
    "Бухгалтерия и финансы": {
        "keywords": ["бухгалтер", "отчётност", "финанс", "налог", "аудит", "зарплат"],
        "services": ["бухгалтерское сопровождение", "налоговый консалтинг", "аудит"],
        "subcategories": {},
    },
    "Дизайн": {
        "keywords": ["дизайн", "брендинг", "логотип", "фирменн", "упаковочн дизайн", "иллюстрац"],
        "services": ["графический дизайн", "брендинг", "дизайн упаковки"],
        "subcategories": {},
    },
}

REQUIREMENT_TOKENS: set[str] = {
    "react", "vue", "angular", "python", "javascript", "java", "php", "1с", "1c",
    "crm", "api", "ios", "android", "figma", "битрикс", "bitrix", "woocommerce",
    "amocrm", "амо", "tilda", "тильда", "wordpress", "flutter", "kotlin", "swift",
    "postgresql", "mysql", "docker", "kubernetes", "ml", "ai", "нейросет",
    "django", "fastapi", "laravel", "next.js", "nextjs", "vue.js",
}

NUMBER_WORDS: dict[str, float] = {
    "один": 1, "одна": 1, "одного": 1, "два": 2, "две": 2, "двух": 2,
    "три": 3, "трёх": 3, "четыре": 4, "четырёх": 4, "пять": 5, "шесть": 6,
    "семь": 7, "восемь": 8, "девять": 9, "десять": 10, "одиннадцать": 11,
    "двенадцать": 12, "полтора": 1.5, "пару": 2, "пара": 2,
}

UNIT_DAYS: dict[str, float] = {
    "день": 1, "дня": 1, "дней": 1, "сутки": 1, "суток": 1,
    "неделя": 7, "недели": 7, "недель": 7,
    "месяц": 30, "месяца": 30, "месяцев": 30,
    "год": 365, "года": 365, "лет": 365,
}

MULTIPLIERS: dict[str, float] = {
    "тысяч": 1000, "тысяча": 1000, "тыс": 1000, "тыс.": 1000, "т": 1000,
    "к": 1000, "k": 1000,
    "миллион": 1_000_000, "миллиона": 1_000_000, "миллионов": 1_000_000,
    "млн": 1_000_000, "млн.": 1_000_000,
    "руб": 1, "руб.": 1, "р": 1, "р.": 1,
}

REGIONS: list[str] = [
    "Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Новосибирск",
    "Самара", "Нижний Новгород", "Краснодар", "Ростов-на-Дону", "Уфа",
    "Пермь", "Челябинск", "Омск", "Красноярск", "Воронеж", "Волгоград",
    "Сочи", "Тюмень", "Ижевск", "Калининград", "Владивосток", "Хабаровск",
    "Иркутск", "Томск", "Ярославль", "Рязань", "Тула", "Саратов",
    "Севастополь", "Крым", "Московская область", "Ленинградская область",
    "Татарстан", "Свердловская область", "Вся Россия", "Россия",
]

_REGION_ALIASES = {
    "москв": "Москва",
    "спб": "Санкт-Петербург",
    "питер": "Санкт-Петербург",
    "санкт-петербург": "Санкт-Петербург",
    "казан": "Казань",
    "екатеринбург": "Екатеринбург",
    "новосибирск": "Новосибирск",
    "самар": "Самара",
    "нижний новгород": "Нижний Новгород",
    "краснодар": "Краснодар",
    "ростов": "Ростов-на-Дону",
    "уфа": "Уфа",
    "перм": "Пермь",
    "челябинск": "Челябинск",
    "омск": "Омск",
    "красноярск": "Красноярск",
    "воронеж": "Воронеж",
    "волгоград": "Волгоград",
    "сочи": "Сочи",
    "тюмен": "Тюмень",
    "ижевск": "Ижевск",
    "калининград": "Калининград",
    "владивосток": "Владивосток",
    "хабаровск": "Хабаровск",
    "иркутск": "Иркутск",
    "томск": "Томск",
    "ярослав": "Ярославль",
    "росси": "Вся Россия",
    "рф": "Вся Россия",
}


def normalize(text: str) -> str:
    return text.lower().strip()


def parse_number(value: str) -> float:
    value = normalize(value).replace(" ", "")
    try:
        return float(value)
    except ValueError:
        return 0.0


MONEY_CONTEXT_TOKENS = ("тысяч", "тыс", "млн", "руб", "бюджет", "стоимость", "цена", "₽", "р.")


def _money_context(low: str, match: re.Match) -> bool:
    """Проверяет, что найденный диапазон чисел относится к деньгам."""
    context = low[max(0, match.start() - 40) : match.end() + 40]
    return any(token in context for token in MONEY_CONTEXT_TOKENS)


def parse_budget(text: str) -> tuple[int | None, int | None]:
    """Извлекает диапазон бюджета из текста. Возвращает (min, max) в рублях."""
    low = normalize(text)

    # «400-600 тысяч» → «400000-600000» (множитель применяется к обеим границам)
    multiplier_pattern = "|".join(
        sorted((re.escape(w) for w in MULTIPLIERS), key=len, reverse=True)
    )
    low = re.sub(
        rf"([\d][\d\s.,]*)\s*[-–—]\s*([\d][\d\s.,]*)\s*({multiplier_pattern})\b",
        lambda m: f" {_amount(m, MULTIPLIERS[m.group(3)], 1)}-{_amount(m, MULTIPLIERS[m.group(3)], 2)} ",
        low,
    )
    # «от 100 до 300 тысяч» → «от 100000 до 300000»
    low = re.sub(
        rf"от\s+([\d][\d\s.,]*)\s*(?:до|—|–|-)\s*([\d][\d\s.,]*)\s*({multiplier_pattern})\b",
        lambda m: f"от {_amount(m, MULTIPLIERS[m.group(3)], 1)} до {_amount(m, MULTIPLIERS[m.group(3)], 2)}",
        low,
    )

    # «600 тысяч» → «600000»
    for word, mult in MULTIPLIERS.items():
        low = re.sub(rf"(\d[\d\s.,]*)\s*{re.escape(word)}\b", lambda m: f" {_amount(m, mult)} ", low)

    # «от X до Y»
    m = re.search(r"от\s+([\d\s.,]+)\s*(?:до|—|–|-)\s*([\d\s.,]+)", low)
    if m:
        return _int(m.group(1)), _int(m.group(2))
    # «до X»
    m = re.search(r"до\s+([\d\s.,]+)", low)
    if m:
        return None, _int(m.group(1))
    # «от X»
    m = re.search(r"от\s+([\d\s.,]+)", low)
    if m:
        return _int(m.group(1)), None
    # «X-Y» (диапазон)
    m = re.search(r"([\d\s.,]+)\s*[-–—]\s*([\d\s.,]+)", low)
    if m and _money_context(low, m):
        return _int(m.group(1)), _int(m.group(2))
    # «бюджет X»
    m = re.search(r"бюджет\w*\s+(?:до\s+)?([\d\s.,]+)", low)
    if m:
        amount = _int(m.group(1))
        return int(amount * 0.8) if amount else None, amount or None
    return None, None


def _amount(match: re.Match, mult: float, group: int = 1) -> str:
    number = parse_number(match.group(group))
    if number:
        return str(int(number * mult))
    return match.group(0)


def _int(raw: str) -> int | None:
    cleaned = re.sub(r"[\s,]", "", raw)
    try:
        return int(float(cleaned))
    except ValueError:
        return None


def parse_deadline_days(text: str) -> int | None:
    """Извлекает срок выполнения в днях."""
    low = normalize(text)
    low = low.replace("двух недель", "14 дней").replace("два месяца", "60 дней")
    low = low.replace("двух месяцев", "60 дней").replace("три месяца", "90 дней")
    low = low.replace("трёх месяцев", "90 дней")

    best: float | None = None
    # «N единиц»
    for m in re.finditer(r"(\d+(?:[.,]\d+)?|полтора|пару)\s*[-–]?\s*(\d+)?\s*(дней|дня|день|недел\w*|месяц\w*|год\w*|суток)", low):
        unit = UNIT_DAYS.get(m.group(3), 1)
        value: float
        if m.group(1) in NUMBER_WORDS:
            value = NUMBER_WORDS[m.group(1)] * unit
        else:
            try:
                value = float(m.group(1).replace(",", ".")) * unit
            except ValueError:
                continue
        if best is None or value < best:
            best = value

    # «срок N» без единицы (считаем днями)
    if best is None:
        m = re.search(r"срок\w*\s+(?:до\s+)?(\d+(?:[.,]\d+)?)", low)
        if m:
            try:
                best = float(m.group(1).replace(",", "."))
            except ValueError:
                pass

    # словами: «срок два месяца»
    if best is None:
        for m in re.finditer(r"(полтора|пару|один|одна|два|две|три|четыре|пять|шесть|семь|восемь|девять|десять)\s+(дня|дней|день|недел\w*|месяц\w*|год\w*)", low):
            unit = UNIT_DAYS.get(m.group(2), 1)
            value = NUMBER_WORDS[m.group(1)] * unit
            if best is None or value < best:
                best = value

    return int(best) if best else None


def detect_category(text: str) -> tuple[str, str | None, list[str]]:
    """Определяет категорию и подкатегорию по ключевым словам."""
    low = normalize(text)
    scores: dict[str, int] = {}
    hits: dict[str, list[str]] = {}
    for category, cfg in CATEGORIES.items():
        count = 0
        found: list[str] = []
        for keyword in cfg["keywords"]:
            if keyword in low:
                count += 1
                found.append(keyword)
        if count:
            scores[category] = count
            hits[category] = found
    if not scores:
        return "Прочее", None, []
    category = max(scores, key=scores.get)
    subcategory = None
    for key, sub in CATEGORIES[category]["subcategories"].items():
        if key in low:
            subcategory = sub
            break
    return category, subcategory, hits[category]


def extract_requirements(text: str) -> list[str]:
    low = normalize(text)
    found = []
    for token in sorted(REQUIREMENT_TOKENS, key=len, reverse=True):
        if token in low:
            found.append(token)
    # добавляем слова с большой буквы, похожие на технологии
    for word in set(re.findall(r"[A-Za-zА-Яа-я0-9]+", text)):
        w = normalize(word)
        if len(w) >= 2 and w not in found:
            if w.isdigit():
                continue
            if w[0].isupper() and w.isalpha() and w.lower() not in found:
                found.append(w)
    return list(dict.fromkeys(found))[:12]


def extract_regions(text: str) -> list[str]:
    low = normalize(text)
    found: list[str] = []
    for alias, region in _REGION_ALIASES.items():
        if alias in low and region not in found:
            found.append(region)
    return found


def build_title(text: str, category: str) -> str:
    low = normalize(text)
    m = re.search(r"нуж(?:ен|на|но|ны)[^.,;]*", low)
    if m:
        candidate = m.group(0).strip()
        if 5 <= len(candidate) <= 80:
            return candidate.capitalize()
    words = [w for w in re.split(r"[^a-zа-яё0-9]+", low) if w]
    if len(words) > 12:
        words = words[:12]
    return (" ".join(words) + f" ({category})").capitalize()


CERTIFICATE_PATTERNS = [
    r"гост[\s\-—]*\d[\d\-]*",
    r"iso[\s\-—]*\d+",
    r"сертификат\s+соответствия",
    r"свидетельство\s+сро",
    r"лицензия\s+мчс",
]


def extract_certificates(text: str) -> list[str]:
    """Извлекает требования к сертификатам из свободного текста."""
    low = normalize(text)
    found: list[str] = []
    for pattern in CERTIFICATE_PATTERNS:
        for m in re.finditer(pattern, low):
            value = m.group(0).strip()
            if value and value not in found:
                found.append(value)
    return found[:5]


def structure_request(description: str) -> dict:
    """Превращает свободное описание в структурированный запрос."""
    text = (description or "").strip()
    category, subcategory, _ = detect_category(text)
    budget_min, budget_max = parse_budget(text)
    deadline_days = parse_deadline_days(text)
    regions = extract_regions(text)
    requirements = extract_requirements(text)
    required_certificates = extract_certificates(text)
    return {
        "title": build_title(text, category),
        "category": category,
        "subcategory": subcategory,
        "requirements": requirements,
        "required_certificates": required_certificates,
        "budget_min": budget_min,
        "budget_max": budget_max,
        "deadline_days": deadline_days,
        "regions": regions,
        "extracted": {
            "category": category,
            "subcategory": subcategory,
            "budget": [budget_min, budget_max],
            "deadline_days": deadline_days,
            "regions": regions,
            "requirements": requirements,
            "required_certificates": required_certificates,
        },
    }


def structure_with_llm(description: str, settings: Settings) -> dict | None:
    """Опциональная структуризация через LLM (OpenAI-совместимый API).

    Возвращает dict с полями структурированного запроса или None,
    если LLM недоступен — тогда используется правило-структуризатор.
    """
    if not (settings.llm_api_url and settings.llm_api_key):
        return None
    prompt = (
        "Ты — ассистент, который превращает свободное описание бизнес-потребности "
        "в структурированный JSON. Верни ТОЛЬКО JSON без markdown со строго такими "
        "ключами: title (короткий заголовок), category, subcategory (или null), "
        "requirements (массив строк), budget_min (int, рублей, или null), "
        "budget_max (int, рублей, или null), deadline_days (int, или null), "
        "regions (массив строк). Описание: " + description
    )
    try:
        response = requests.post(
            settings.llm_api_url.rstrip("/") + "/chat/completions",
            headers={"Authorization": f"Bearer {settings.llm_api_key}"},
            json={
                "model": settings.llm_model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
            },
            timeout=30,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        content = content.strip().removeprefix("```json").removesuffix("```").strip()
        parsed = json.loads(content)
        return {
            "title": str(parsed.get("title") or ""),
            "category": str(parsed.get("category") or "Прочее"),
            "subcategory": parsed.get("subcategory"),
            "requirements": [str(r) for r in parsed.get("requirements") or []],
            "required_certificates": [str(c) for c in parsed.get("required_certificates") or []],
            "budget_min": _int(str(parsed["budget_min"])) if parsed.get("budget_min") else None,
            "budget_max": _int(str(parsed["budget_max"])) if parsed.get("budget_max") else None,
            "deadline_days": int(parsed["deadline_days"]) if parsed.get("deadline_days") else None,
            "regions": [str(r) for r in parsed.get("regions") or []],
            "extracted": {"source": "llm"},
        }
    except Exception:
        return None
