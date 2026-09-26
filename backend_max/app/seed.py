from __future__ import annotations


from sqlalchemy.orm import Session

from .config import get_settings
from .deps import sync_admin_flag
from .matching import match_company
from .models import Company, Request, RequestMatch, User
from .roles import (
    ROLE_BUSINESS_USER,
    ROLE_COMPANY_ADMIN,
    ROLE_MODERATOR,
    ROLE_PLATFORM_ADMIN,
    SEED_BUSINESS_USER,
    SEED_COMPANY_ADMIN,
    SEED_MODERATOR,
    SEED_PLATFORM_ADMIN,
)
from .services import ensure_owner_member, publish_request
from .structurizer import structure_request
from .seed_extras import seed_wave_a_extras

settings = get_settings()

ROLE_BY_MAX_ID = {
    SEED_PLATFORM_ADMIN: ROLE_PLATFORM_ADMIN,
    SEED_COMPANY_ADMIN: ROLE_COMPANY_ADMIN,
    SEED_BUSINESS_USER: ROLE_BUSINESS_USER,
    SEED_MODERATOR: ROLE_MODERATOR,
}
DEMO_COMPANIES: list[dict] = [
    {
        "user": {"max_user_id": 7777001, "first_name": "Анна", "last_name": "Смирнова", "username": "anna_smirnova"},
        "company": {
            "name": "МебельПро", "inn": "1655011001", "is_verified": True,
            "description": "Производитель корпусной мебели. Собственное производство в Казани, 12 лет на рынке.",
            "registration_date": "2012-04-17",
            "company_status": "Действующая", "verification_source": "ЕГРЮЛ (тестовые данные)",
            "industries": ["Производство"], "services": ["мебель на заказ"],
            "competencies": ["производство мебели", "корпусная мебель", "деревообработка"],
            "regions": ["Казань", "Татарстан", "Вся Россия"], "budget_min": 100_000, "budget_max": 1_500_000,
            "max_term_days": 45,
            "cases": [
                {"title": "Мебель для сети кофеен", "description": "Изготовление 200 столов и 600 стульев за 40 дней"},
                {"title": "Гостиничный комплекс", "description": "Меблировка 120 номеров под ключ"},
            ],
            "certificates": ["ГОСТ 16371-2014"], "website": "https://mebelpro.example", "phone": "+7 900 000-00-01",
        },
    },
    {
        "user": {"max_user_id": 7777002, "first_name": "Дмитрий", "last_name": "Кузнецов", "username": "dkuz"},
        "company": {
            "name": "DigitalLab", "inn": "7705002002", "is_verified": True,
            "description": "Разработка веб-сервисов и интеграций. React, Python, 1С, CRM-автоматизация.",
            "registration_date": "2015-09-02",
            "company_status": "Действующая", "verification_source": "ЕГРЮЛ (тестовые данные)",
            "industries": ["IT-разработка"], "services": ["web-разработка", "интеграции", "автоматизация"],
            "competencies": ["react", "python", "1с", "api", "crm", "интернет-магазин"],
            "regions": ["Москва", "Вся Россия"], "budget_min": 300_000, "budget_max": 5_000_000,
            "max_term_days": 90,
            "cases": [
                {"title": "B2B-портал для дистрибьютора", "description": "Каталог, личный кабинет, интеграция с 1С, 2 месяца"},
                {"title": "Интернет-магазин мебели", "description": "React + 1С, 500 тыс. ₽, 1,5 месяца"},
            ],
            "certificates": ["Сертификат 1С:Франчайзи"], "website": "https://digitallab.example", "phone": "+7 900 000-00-02",
        },
    },
    {
        "user": {"max_user_id": 7777003, "first_name": "Ольга", "last_name": "Ветрова", "username": "ovetrova"},
        "company": {
            "name": "WebForge", "inn": "7806003003", "is_verified": True,
            "description": "Веб-студия: сайты, интернет-магазины, дизайн. Работаем с МСП по всей России.",
            "registration_date": "2018-01-25",
            "company_status": "Действующая", "verification_source": "ЕГРЮЛ (тестовые данные)",
            "industries": ["IT-разработка", "Дизайн"], "services": ["web-разработка", "графический дизайн"],
            "competencies": ["react", "figma", "wordpress", "интернет-магазин", "дизайн"],
            "regions": ["Санкт-Петербург", "Ленинградская область", "Вся Россия"], "budget_min": 100_000, "budget_max": 800_000,
            "max_term_days": 60,
            "cases": [
                {"title": "Сайт кафе с доставкой", "description": "WordPress, 150 тыс. ₽, 3 недели"},
                {"title": "Редизайн интернет-магазина", "description": "Figma + React, 400 тыс. ₽"},
            ],
            "certificates": [], "website": "https://webforge.example", "phone": "+7 900 000-00-03",
        },
    },
    {
        "user": {"max_user_id": 7777004, "first_name": "Марат", "last_name": "Гарипов", "username": "mgaripov"},
        "company": {
            "name": "ЛогистикГрупп", "inn": "1656004004", "is_verified": False,
            "description": "Доставка по городу и межгород. Складские услуги и фулфилмент для интернет-магазинов.",
            "registration_date": "2019-06-11",
            "company_status": "Действующая", "verification_source": None,
            "industries": ["Логистика"], "services": ["доставка по городу", "грузоперевозки", "фулфилмент"],
            "competencies": ["доставка", "фулфилмент", "склад"],
            "regions": ["Казань", "Татарстан", "Вся Россия"], "budget_min": 30_000, "budget_max": 500_000,
            "max_term_days": 30,
            "cases": [{"title": "Фулфилмент для ИМ одежды", "description": "2000 заказов/мес"}],
            "certificates": [], "website": "", "phone": "+7 900 000-00-04",
        },
    },
    {
        "user": {"max_user_id": 7777005, "first_name": "Екатерина", "last_name": "Соколова", "username": "esokolova"},
        "company": {
            "name": "МаркетЛаб", "inn": "6678005005", "is_verified": True,
            "description": "Маркетинговое агентство: SMM, контекстная реклама, SEO для МСП.",
            "registration_date": "2016-11-08",
            "company_status": "Действующая", "verification_source": "ЕГРЮЛ (тестовые данные)",
            "industries": ["Маркетинг и реклама"], "services": ["smm-продвижение", "контекстная реклама", "seo"],
            "competencies": ["smm", "контекстная реклама", "яндекс.директ", "seo"],
            "regions": ["Екатеринбург", "Свердловская область", "Вся Россия"], "budget_min": 50_000, "budget_max": 600_000,
            "max_term_days": 30,
            "cases": [
                {"title": "SMM для сети пекарен", "description": "Рост подписчиков в 4 раза за квартал"},
                {"title": "Контекст для клиники", "description": "CPL снижен на 35%"},
            ],
            "certificates": ["Сертификат Яндекс.Директ"], "website": "https://marketlab.example", "phone": "+7 900 000-00-05",
        },
    },
    {
        "user": {"max_user_id": 7777006, "first_name": "Игорь", "last_name": "Белов", "username": "ibelov"},
        "company": {
            "name": "СтройКомплект", "inn": "5407006006", "is_verified": False,
            "description": "Ремонт офисов и торговых помещений под ключ. Собственные бригады.",
            "registration_date": "2014-03-30",
            "company_status": "Действующая", "verification_source": None,
            "industries": ["Строительство и ремонт"], "services": ["ремонт помещений", "отделочные работы"],
            "competencies": ["ремонт", "отделка", "электромонтаж"],
            "regions": ["Новосибирск", "Вся Россия"], "budget_min": 200_000, "budget_max": 3_000_000,
            "max_term_days": 120,
            "cases": [{"title": "Ремонт офиса 400 м²", "description": "45 дней, 2,8 млн ₽"}],
            "certificates": [], "website": "", "phone": "+7 900 000-00-06",
        },
    },
    {
        "user": {"max_user_id": 7777007, "first_name": "Наталья", "last_name": "Орлова", "username": "norlova"},
        "company": {
            "name": "ФинСервис", "inn": "7725007007", "is_verified": True,
            "description": "Бухгалтерское сопровождение малого бизнеса. Отчётность, налоги, зарплата.",
            "registration_date": "2011-12-14",
            "company_status": "Действующая", "verification_source": "ЕГРЮЛ (тестовые данные)",
            "industries": ["Бухгалтерия и финансы"], "services": ["бухгалтерское сопровождение", "налоговый консалтинг"],
            "competencies": ["бухгалтерия", "отчётность", "налоги"],
            "regions": ["Москва", "Вся Россия"], "budget_min": 10_000, "budget_max": 200_000,
            "max_term_days": 365,
            "cases": [{"title": "Бухгалтерия для ИТ-стартапа", "description": "Сопровождение 3 года"}],
            "certificates": [], "website": "https://finservice.example", "phone": "+7 900 000-00-07",
        },
    },
    {
        "user": {"max_user_id": 7777008, "first_name": "Павел", "last_name": "Титов", "username": "ptitov"},
        "company": {
            "name": "ПечатьЦентр", "inn": "6318008008", "is_verified": False,
            "description": "Полиграфия: визитки, упаковка, сувенирная продукция. Типография в Самаре.",
            "registration_date": "2017-07-19",
            "company_status": "Действующая", "verification_source": None,
            "industries": ["Производство"], "services": ["полиграфия", "упаковка"],
            "competencies": ["полиграфия", "печать", "упаковка"],
            "regions": ["Самара", "Вся Россия"], "budget_min": 20_000, "budget_max": 400_000,
            "max_term_days": 21,
            "cases": [{"title": "Упаковка для кондитерской", "description": "10 000 коробок, 2 недели"}],
            "certificates": [], "website": "", "phone": "+7 900 000-00-08",
        },
    },
]

DEMO_REQUESTS: list[dict] = [
    {
        "by": "МебельПро",
        "description": (
            "Нужна разработка интернет-магазина для производителя мебели. "
            "React, интеграция с 1С, бюджет 400-600 тысяч рублей, срок два месяца, Москва."
        ),
    },
    {
        "by": "ПечатьЦентр",
        "description": (
            "Требуется SMM-продвижение и контекстная реклама для типографии. "
            "Бюджет до 150 тысяч, срок один месяц, регион Самара."
        ),
    },
    {
        "by": "СтройКомплект",
        "description": (
            "Нужен поставщик упаковки и полиграфии для сети из трёх магазинов. "
            "От 100 до 300 тысяч рублей, поставки два раза в месяц, Новосибирск."
        ),
    },
]


def seed_demo(db: Session) -> None:
    """Наполняет БД демо-данными. Идемпотентно: повторный вызов не дублирует."""
    existing_company_names = {name for (name,) in db.query(Company.name).all()}

    company_by_name: dict[str, Company] = {}
    for entry in DEMO_COMPANIES:
        user_data = dict(entry["user"])
        company_name = entry["company"]["name"]
        user = db.query(User).filter(User.max_user_id == user_data["max_user_id"]).first()
        if user is None:
            user = User(**user_data)
            db.add(user)
            db.flush()
        max_id = user_data["max_user_id"]
        user.role = ROLE_BY_MAX_ID.get(max_id, ROLE_COMPANY_ADMIN)
        sync_admin_flag(user)
        if company_name not in existing_company_names:
            company = Company(user_id=user.id, **entry["company"])
            if entry["company"].get("is_verified"):
                company.verification_status = "VERIFIED"
            db.add(company)
            db.flush()
            existing_company_names.add(company_name)
        else:
            company = db.query(Company).filter(Company.name == company_name).first()
        company_by_name[company_name] = company
        ensure_owner_member(db, company, user)
    # Moderator without company
    mod = db.query(User).filter(User.max_user_id == SEED_MODERATOR).first()
    if mod is None:
        mod = User(
            max_user_id=SEED_MODERATOR,
            first_name="Мария",
            last_name="Модератор",
            username="moderator",
            role=ROLE_MODERATOR,
            is_admin=False,
        )
        db.add(mod)
    else:
        mod.role = ROLE_MODERATOR
        sync_admin_flag(mod)
    db.commit()

    existing_titles = {title for (title,) in db.query(Request.title).all()}
    for entry in DEMO_REQUESTS:
        author = company_by_name[entry["by"]]
        structured = structure_request(entry["description"])
        if structured["title"] in existing_titles:
            continue
        request = Request(
            company_id=author.id,
            title=structured["title"],
            description_raw=entry["description"],
            category=structured["category"],
            subcategory=structured["subcategory"],
            requirements=structured["requirements"],
            budget_min=structured["budget_min"],
            budget_max=structured["budget_max"],
            deadline_days=structured["deadline_days"],
            regions=structured["regions"],
            proposals_deadline_days=14,
            status="draft",
        )
        db.add(request)
        db.commit()
        db.refresh(request)
        publish_request(db, request)
        recompute_matches_for_seed(db, request)
        existing_titles.add(structured["title"])
    db.commit()
    seed_wave_a_extras(db)


def recompute_matches_for_seed(db: Session, request: Request) -> None:
    """Создаёт матчи без отправки уведомлений (для seed)."""
    companies = db.query(Company).filter(Company.id != request.company_id).all()
    for company in companies:
        score, criteria = match_company(request, company)
        if score < settings.min_match_score:
            continue
        db.add(
            RequestMatch(
                request_id=request.id,
                company_id=company.id,
                score=score,
                criteria=[c.as_dict() for c in criteria],
            )
        )


if __name__ == "__main__":
    from .db import SessionLocal, init_db

    init_db()
    db = SessionLocal()
    try:
        seed_demo(db)
        print("Демо-данные загружены")
    finally:
        db.close()
