"""Extra demo rows for Wave A (workspace, marketplace graph, moderation, dicts)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from .models import (
    AuditEvent,
    Company,
    CompanyActivityEvent,
    CompanyCaseItem,
    CompanyDocumentItem,
    CompanyMember,
    CompanyServiceItem,
    Deal,
    DictionaryItem,
    Escalation,
    Favorite,
    ModerationItem,
    NotificationLog,
    OpportunityInvite,
    Proposal,
    Report,
    Request,
    User,
    utcnow,
)
from .roles import (
    MEMBER_ROLE_MANAGER,
    MEMBER_ROLE_VIEWER,
    MEMBER_STATUS_ACTIVE,
    MEMBER_STATUS_INVITED,
    SEED_BUSINESS_USER,
    SEED_COMPANY_ADMIN,
    SEED_MODERATOR,
    SEED_PLATFORM_ADMIN,
)
from .structurizer import CATEGORIES, REGIONS


def _user_by_max(db: Session, max_id: int) -> User | None:
    return db.query(User).filter(User.max_user_id == max_id).first()


def _company_by_name(db: Session, name: str) -> Company | None:
    return db.query(Company).filter(Company.name == name).first()


def seed_dictionaries(db: Session) -> None:
    if db.query(DictionaryItem).count() > 0:
        return
    order = 0
    for cat_name in CATEGORIES:
        order += 1
        db.add(
            DictionaryItem(
                type="category",
                name=cat_name,
                slug=cat_name.lower().replace(" ", "-").replace("ё", "е"),
                sort_order=order,
                status="active",
            )
        )
    for i, region in enumerate(REGIONS[:20]):
        db.add(
            DictionaryItem(
                type="region",
                name=region,
                slug=region.lower().replace(" ", "-").replace("ё", "е"),
                sort_order=i + 1,
                status="active",
            )
        )
    for i, industry in enumerate(
        ["IT", "Производство", "Логистика", "Маркетинг", "Строительство", "Финансы"]
    ):
        db.add(
            DictionaryItem(
                type="industry",
                name=industry,
                slug=industry.lower(),
                sort_order=i + 1,
                status="active",
            )
        )
    db.commit()


def seed_digital_lab_workspace(db: Session) -> None:
    company = _company_by_name(db, "DigitalLab")
    owner = _user_by_max(db, SEED_COMPANY_ADMIN)
    if company is None or owner is None:
        return

    if db.query(CompanyServiceItem).filter(CompanyServiceItem.company_id == company.id).count() == 0:
        for row in [
            {
                "title": "Разработка B2B-порталов",
                "description": "Каталоги, ЛК, интеграции с 1С/CRM",
                "category": "IT-разработка",
                "status": "published",
                "short_description": "Порталы под ключ",
                "price_min": 400_000,
                "price_max": 2_000_000,
                "regions": ["Москва", "Вся Россия"],
                "remote": True,
                "technologies": ["react", "python", "1с"],
                "capabilities": ["интеграции", "web"],
                "target_industries": ["Производство", "Дистрибуция"],
            },
            {
                "title": "Интеграции с 1С",
                "description": "Обмен заказами, остатками, контрагентами",
                "category": "IT-разработка",
                "status": "published",
                "short_description": "1С ↔ веб",
                "price_min": 150_000,
                "price_max": 800_000,
                "regions": ["Вся Россия"],
                "remote": True,
                "technologies": ["1с", "api"],
                "capabilities": ["интеграции"],
                "target_industries": ["Ритейл"],
            },
            {
                "title": "CRM-автоматизация",
                "description": "Настройка воронок и интеграций",
                "category": "IT-разработка",
                "status": "draft",
                "short_description": "CRM setup",
                "price_min": 80_000,
                "price_max": 400_000,
                "regions": ["Москва"],
                "remote": True,
                "technologies": ["crm", "api"],
                "capabilities": ["автоматизация"],
                "target_industries": ["Услуги"],
            },
        ]:
            db.add(CompanyServiceItem(company_id=company.id, **row))

    if db.query(CompanyCaseItem).filter(CompanyCaseItem.company_id == company.id).count() == 0:
        for row in [
            {
                "title": "B2B-портал для дистрибьютора",
                "industry": "Дистрибуция",
                "description": "Каталог, ЛК, интеграция с 1С",
                "result": "Заказы online +35%",
                "technologies": ["react", "python", "1с"],
                "status": "published",
                "client_name": "Дистрибьютор Х",
                "client_visible": True,
                "solution": "SPA + REST + 1С",
                "start_date": "2023-01-01",
                "end_date": "2023-03-15",
            },
            {
                "title": "Интернет-магазин мебели",
                "industry": "Производство",
                "description": "React + 1С",
                "result": "Запуск за 1,5 месяца",
                "technologies": ["react", "1с"],
                "status": "published",
                "client_name": "МебельПро",
                "client_visible": True,
                "start_date": "2024-02-01",
                "end_date": "2024-03-20",
            },
            {
                "title": "Черновик кейса",
                "industry": "IT",
                "description": "В работе",
                "result": "",
                "technologies": ["python"],
                "status": "draft",
                "client_visible": False,
            },
        ]:
            db.add(CompanyCaseItem(company_id=company.id, **row))

    if db.query(CompanyDocumentItem).filter(CompanyDocumentItem.company_id == company.id).count() == 0:
        for row in [
            {
                "name": "Сертификат 1С:Франчайзи",
                "doc_type": "certificate",
                "file_name": "1c-franchise.pdf",
                "status": "Verified",
                "issuer": "1С",
                "issued_at": "2023-05-01",
                "verification_source": "COMPANY_DATA",
            },
            {
                "name": "Выписка ЕГРЮЛ",
                "doc_type": "legal",
                "file_name": "egrul.pdf",
                "status": "Pending",
                "issuer": "ФНС",
                "verification_source": "COMPANY_DATA",
            },
        ]:
            db.add(CompanyDocumentItem(company_id=company.id, **row))

    # Extra team members (invited/active) — skip if email already exists
    existing_emails = {
        e for (e,) in db.query(CompanyMember.email).filter(CompanyMember.company_id == company.id).all()
    }
    extras = [
        ("Ирина", "Менеджер", "manager@digitallab.example", MEMBER_ROLE_MANAGER, MEMBER_STATUS_ACTIVE),
        ("Сергей", "Наблюдатель", "viewer@digitallab.example", MEMBER_ROLE_VIEWER, MEMBER_STATUS_INVITED),
    ]
    for first, last, email, role, status in extras:
        if email in existing_emails:
            continue
        db.add(
            CompanyMember(
                company_id=company.id,
                user_id=None,
                first_name=first,
                last_name=last,
                email=email,
                member_role=role,
                status=status,
                joined_at=utcnow() if status == MEMBER_STATUS_ACTIVE else None,
            )
        )

    if db.query(CompanyActivityEvent).filter(CompanyActivityEvent.company_id == company.id).count() == 0:
        for row in [
            ("service", "Дмитрий Кузнецов", "опубликовал услугу", "Разработка B2B-порталов"),
            ("case", "Дмитрий Кузнецов", "добавил кейс", "B2B-портал для дистрибьютора"),
            ("document", "Дмитрий Кузнецов", "загрузил документ", "Сертификат 1С:Франчайзи"),
            ("member", "Дмитрий Кузнецов", "пригласил участника", "manager@digitallab.example"),
            ("profile", "Дмитрий Кузнецов", "обновил профиль", "DigitalLab"),
        ]:
            db.add(
                CompanyActivityEvent(
                    company_id=company.id,
                    type=row[0],
                    actor_name=row[1],
                    action=row[2],
                    entity_label=row[3],
                )
            )
    db.commit()


def seed_marketplace_graph(db: Session) -> None:
    """Proposals, deals, favorites, invites, notifications for demo."""
    mebel = _company_by_name(db, "МебельПро")
    digital = _company_by_name(db, "DigitalLab")
    webforge = _company_by_name(db, "WebForge")
    marketlab = _company_by_name(db, "МаркетЛаб")
    if not all([mebel, digital, webforge]):
        return

    owner_mebel = _user_by_max(db, SEED_PLATFORM_ADMIN)
    owner_digital = _user_by_max(db, SEED_COMPANY_ADMIN)
    owner_web = _user_by_max(db, SEED_BUSINESS_USER)
    if not all([owner_mebel, owner_digital, owner_web]):
        return

    # Prefer IT shop request authored by МебельПро
    requests = db.query(Request).filter(Request.company_id == mebel.id).all()
    if not requests:
        requests = db.query(Request).all()
    if not requests:
        return
    opp = requests[0]

    if db.query(Proposal).filter(Proposal.request_id == opp.id).count() == 0:
        p_digital = Proposal(
            request_id=opp.id,
            company_id=digital.id,
            price=520_000,
            term_days=50,
            solution_text="React-витрина + кабинет + обмен с 1С по REST",
            case_ref="Интернет-магазин мебели",
            comment="Можем стартовать на следующей неделе",
            status="shortlisted",
            viewed_at=utcnow(),
        )
        p_web = Proposal(
            request_id=opp.id,
            company_id=webforge.id,
            price=480_000,
            term_days=55,
            solution_text="Интернет-магазин на React + WordPress headless",
            case_ref="Редизайн интернет-магазина",
            status="viewed",
            viewed_at=utcnow(),
        )
        db.add(p_digital)
        db.add(p_web)
        db.flush()

        if db.query(Deal).filter(Deal.proposal_id == p_digital.id).count() == 0:
            db.add(
                Deal(
                    opportunity_id=opp.id,
                    proposal_id=p_digital.id,
                    customer_company_id=mebel.id,
                    executor_company_id=digital.id,
                    status="negotiating",
                )
            )
            p_digital.status = "negotiating"

    # SMM request proposals if exists
    smm_reqs = [r for r in db.query(Request).all() if "SMM" in (r.title or "") or "smm" in (r.description_raw or "").lower()]
    if smm_reqs and marketlab is not None:
        smm = smm_reqs[0]
        if db.query(Proposal).filter(Proposal.request_id == smm.id, Proposal.company_id == marketlab.id).count() == 0:
            db.add(
                Proposal(
                    request_id=smm.id,
                    company_id=marketlab.id,
                    price=120_000,
                    term_days=30,
                    solution_text="SMM + контекст, еженедельные отчёты",
                    status="sent",
                )
            )

    # Favorites
    for user, target_type, target_id in [
        (owner_web, "company", digital.id),
        (owner_digital, "opportunity", opp.id),
        (owner_mebel, "company", digital.id),
    ]:
        exists = (
            db.query(Favorite)
            .filter(
                Favorite.user_id == user.id,
                Favorite.target_type == target_type,
                Favorite.target_id == target_id,
            )
            .first()
        )
        if not exists:
            db.add(Favorite(user_id=user.id, target_type=target_type, target_id=target_id))

    # Opportunity invite DigitalLab → WebForge on mebel opp (if not exists)
    if (
        db.query(OpportunityInvite)
        .filter(OpportunityInvite.opportunity_id == opp.id, OpportunityInvite.company_id == webforge.id)
        .first()
        is None
    ):
        db.add(
            OpportunityInvite(
                opportunity_id=opp.id,
                company_id=webforge.id,
                invited_by_user_id=owner_mebel.id,
            )
        )

    # Notifications inbox
    if db.query(NotificationLog).filter(NotificationLog.target_user_id == owner_digital.id).count() == 0:
        for text, uid in [
            (f"Вас добавили в shortlist по запросу «{opp.title}»", owner_digital.id),
            (f"Заказчик открыл переговоры по «{opp.title}»", owner_digital.id),
            (f"Новое предложение от DigitalLab по «{opp.title}»", owner_mebel.id),
            ("Вам подошёл новый заказ на 85%", owner_web.id),
        ]:
            db.add(
                NotificationLog(
                    user_id=None,
                    target_user_id=uid,
                    text=text,
                    ok=True,
                    is_read=False,
                )
            )
    db.commit()


def seed_moderation_demo(db: Session) -> None:
    """Extra moderation/report/escalation rows beyond publish enqueue."""
    digital = _company_by_name(db, "DigitalLab")
    mebel = _company_by_name(db, "МебельПро")
    stroi = _company_by_name(db, "СтройКомплект")
    owner_digital = _user_by_max(db, SEED_COMPANY_ADMIN)
    owner_mebel = _user_by_max(db, SEED_PLATFORM_ADMIN)
    mod = _user_by_max(db, SEED_MODERATOR)
    if digital is None or owner_digital is None:
        return

    # Company pending verification item
    if (
        db.query(ModerationItem)
        .filter(ModerationItem.entity_type == "company", ModerationItem.entity_id == str(stroi.id if stroi else digital.id))
        .count()
        == 0
        and stroi is not None
    ):
        db.add(
            ModerationItem(
                entity_type="company",
                entity_id=str(stroi.id),
                title=f"Верификация: {stroi.name}",
                owner_id=str(stroi.user_id),
                owner_name="Игорь Белов",
                company_name=stroi.name,
                status="PENDING",
                priority="HIGH",
                reason="VERIFICATION",
                summary="Заявка на верификацию компании",
                payload={"inn": stroi.inn},
                checklist=["ИНН", "Документы", "Сайт"],
            )
        )

    # Case / document items for DigitalLab
    case = db.query(CompanyCaseItem).filter(CompanyCaseItem.company_id == digital.id).first()
    if case and db.query(ModerationItem).filter(ModerationItem.entity_type == "case", ModerationItem.entity_id == str(case.id)).count() == 0:
        db.add(
            ModerationItem(
                entity_type="case",
                entity_id=str(case.id),
                title=case.title,
                owner_id=str(owner_digital.id),
                owner_name="Дмитрий Кузнецов",
                company_name=digital.name,
                status="IN_REVIEW",
                priority="NORMAL",
                reason="NEW_CASE",
                summary=case.description[:300],
                assigned_moderator_id=mod.id if mod else None,
                assigned_moderator_name="Мария Модератор" if mod else None,
            )
        )

    doc = db.query(CompanyDocumentItem).filter(CompanyDocumentItem.company_id == digital.id, CompanyDocumentItem.status == "Pending").first()
    if doc and db.query(ModerationItem).filter(ModerationItem.entity_type == "document", ModerationItem.entity_id == str(doc.id)).count() == 0:
        db.add(
            ModerationItem(
                entity_type="document",
                entity_id=str(doc.id),
                title=doc.name,
                owner_id=str(owner_digital.id),
                owner_name="Дмитрий Кузнецов",
                company_name=digital.name,
                status="PENDING",
                priority="NORMAL",
                reason="NEW_DOCUMENT",
                summary="Документ на проверку",
            )
        )

    # One approved + one needs_changes history item
    if db.query(ModerationItem).filter(ModerationItem.status == "APPROVED").count() == 0 and mebel is not None:
        db.add(
            ModerationItem(
                entity_type="opportunity",
                entity_id="seed-approved-1",
                title="(архив) Запрос на логистику",
                owner_id=str(owner_mebel.id) if owner_mebel else None,
                owner_name="Анна Смирнова",
                company_name=mebel.name,
                status="APPROVED",
                priority="NORMAL",
                reason="NEW_OPPORTUNITY",
                summary="Одобрено ранее",
                assigned_moderator_id=mod.id if mod else None,
                assigned_moderator_name="Мария Модератор" if mod else None,
                moderator_note="Ок",
            )
        )
    if db.query(ModerationItem).filter(ModerationItem.status == "NEEDS_CHANGES").count() == 0:
        db.add(
            ModerationItem(
                entity_type="opportunity",
                entity_id="seed-changes-1",
                title="Запрос без бюджета",
                owner_id=str(owner_digital.id),
                owner_name="Дмитрий Кузнецов",
                company_name=digital.name,
                status="NEEDS_CHANGES",
                priority="NORMAL",
                reason="NEW_OPPORTUNITY",
                summary="Уточните бюджет",
                assigned_moderator_id=mod.id if mod else None,
                assigned_moderator_name="Мария Модератор" if mod else None,
                moderator_note="Добавьте диапазон бюджета",
            )
        )

    # Reports
    owner_web = _user_by_max(db, SEED_BUSINESS_USER)
    if db.query(Report).count() == 0 and mebel is not None and owner_web is not None:
        first_req = db.query(Request).first()
        r1 = Report(
            reporter_id=owner_web.id,
            reporter_name="Ольга Ветрова",
            target_type="company",
            target_id=str(digital.id),
            target_name=digital.name,
            report_type="SPAM",
            description="Подозрительные контакты в профиле",
            status="OPEN",
            priority="NORMAL",
        )
        r2 = Report(
            reporter_id=owner_mebel.id if owner_mebel else owner_web.id,
            reporter_name="Анна Смирнова",
            target_type="opportunity",
            target_id=str(first_req.id) if first_req else "1",
            target_name=first_req.title if first_req else "Запрос",
            report_type="MISLEADING",
            description="Завышенный бюджет",
            status="IN_PROGRESS",
            priority="HIGH",
            assigned_moderator_id=mod.id if mod else None,
        )
        db.add(r1)
        db.add(r2)
        db.flush()
        if db.query(Escalation).count() == 0:
            db.add(
                Escalation(
                    report_id=r2.id,
                    title=f"Эскалация: {r2.target_name}",
                    reason="Повторные жалобы",
                    status="OPEN",
                    created_by_id=mod.id if mod else None,
                )
            )

    # Moderator / admin notification via NotificationLog
    if mod and db.query(NotificationLog).filter(NotificationLog.target_user_id == mod.id).count() == 0:
        for text in [
            "Новая жалоба на компанию DigitalLab",
            "В очереди модерации 3+ элемента",
            "Эскалация: повторные жалобы",
        ]:
            db.add(NotificationLog(target_user_id=mod.id, text=text, ok=True, is_read=False))

    admin = _user_by_max(db, SEED_PLATFORM_ADMIN)
    if admin and db.query(NotificationLog).filter(NotificationLog.target_user_id == admin.id, NotificationLog.text.like("%эскалац%")).count() == 0:
        db.add(
            NotificationLog(
                target_user_id=admin.id,
                text="Критическая эскалация модерации требует внимания",
                ok=True,
                is_read=False,
            )
        )

    # Audit sample
    if db.query(AuditEvent).count() == 0 and admin:
        db.add(
            AuditEvent(
                actor_id=str(admin.id),
                actor_name="Анна Смирнова",
                actor_role="PLATFORM_ADMIN",
                action="seed.bootstrap",
                entity_type="platform",
                entity_id="0",
                entity_name="B2B Match",
                reason="Wave A demo seed",
            )
        )
        if mod:
            db.add(
                AuditEvent(
                    actor_id=str(mod.id),
                    actor_name="Мария Модератор",
                    actor_role="MODERATOR",
                    action="moderation.assign",
                    entity_type="moderation_item",
                    entity_id="seed",
                    entity_name="Очередь",
                )
            )
    db.commit()


def seed_wave_a_extras(db: Session) -> None:
    from .services import enqueue_moderation_for_request

    # Backfill moderation for already-published opportunities
    for req in db.query(Request).filter(Request.status == "published").all():
        enqueue_moderation_for_request(db, req)

    seed_dictionaries(db)
    seed_digital_lab_workspace(db)
    seed_marketplace_graph(db)
    seed_moderation_demo(db)
