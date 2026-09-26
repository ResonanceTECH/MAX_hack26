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
    ROLE_BUSINESS_USER,
    SEED_BUSINESS_USER,
    SEED_COMPANY_ADMIN,
    SEED_MANAGER,
    SEED_MODERATOR,
    SEED_PENDING_INVITE_TOKEN,
    SEED_PLATFORM_ADMIN,
    SEED_VIEWER,
)
from .structurizer import CATEGORIES, REGIONS
from .services import publish_request


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
                "status": "active",
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
                "status": "active",
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

    # Fix legacy published → active for public list filter
    for svc in db.query(CompanyServiceItem).filter(
        CompanyServiceItem.company_id == company.id,
        CompanyServiceItem.status == "published",
    ).all():
        svc.status = "active"

    # Manager / Viewer loginable users + pending invite
    seed_digitallab_members(db, company, owner)

    if db.query(CompanyActivityEvent).filter(CompanyActivityEvent.company_id == company.id).count() == 0:
        for row in [
            ("service", "Дмитрий Кузнецов", "опубликовал услугу", "Разработка B2B-порталов"),
            ("case", "Дмитрий Кузнецов", "добавил кейс", "B2B-портал для дистрибьютора"),
            ("document", "Дмитрий Кузнецов", "загрузил документ", "Сертификат 1С:Франчайзи"),
            ("member", "Дмитрий Кузнецов", "пригласил участника", "manager@digitallab.test"),
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


def seed_digitallab_members(db: Session, company: Company, owner: User) -> None:
    """Manager 7777010, Viewer 7777011, pending invite token for FE demo."""
    from datetime import timedelta

    manager = _user_by_max(db, SEED_MANAGER)
    if manager is None:
        manager = User(
            max_user_id=SEED_MANAGER,
            first_name="Игорь",
            last_name="Петров",
            username="ipetrov",
            email="manager@digitallab.test",
            role=ROLE_BUSINESS_USER,
            is_admin=False,
        )
        db.add(manager)
        db.flush()
    else:
        manager.first_name = manager.first_name or "Игорь"
        manager.last_name = manager.last_name or "Петров"
        manager.email = manager.email or "manager@digitallab.test"
        manager.role = ROLE_BUSINESS_USER

    viewer = _user_by_max(db, SEED_VIEWER)
    if viewer is None:
        viewer = User(
            max_user_id=SEED_VIEWER,
            first_name="Мария",
            last_name="Козлова",
            username="mkozlova",
            email="viewer@digitallab.test",
            role=ROLE_BUSINESS_USER,
            is_admin=False,
        )
        db.add(viewer)
        db.flush()
    else:
        viewer.first_name = viewer.first_name or "Мария"
        viewer.last_name = viewer.last_name or "Козлова"
        viewer.email = viewer.email or "viewer@digitallab.test"
        viewer.role = ROLE_BUSINESS_USER

    # Remove legacy orphan member rows (user_id=None) with old demo emails
    for email in ("manager@digitallab.example", "viewer@digitallab.example"):
        orphan = (
            db.query(CompanyMember)
            .filter(CompanyMember.company_id == company.id, CompanyMember.email == email)
            .first()
        )
        if orphan and orphan.user_id is None:
            db.delete(orphan)

    def _upsert_member(user: User, email: str, role: str, first: str, last: str) -> None:
        row = (
            db.query(CompanyMember)
            .filter(CompanyMember.company_id == company.id, CompanyMember.email == email)
            .first()
        )
        if row is None:
            row = (
                db.query(CompanyMember)
                .filter(CompanyMember.company_id == company.id, CompanyMember.user_id == user.id)
                .first()
            )
        if row is None:
            db.add(
                CompanyMember(
                    company_id=company.id,
                    user_id=user.id,
                    first_name=first,
                    last_name=last,
                    email=email,
                    member_role=role,
                    status=MEMBER_STATUS_ACTIVE,
                    joined_at=utcnow(),
                    invited_by_user_id=owner.id,
                )
            )
        else:
            row.user_id = user.id
            row.first_name = first
            row.last_name = last
            row.email = email
            row.member_role = role
            row.status = MEMBER_STATUS_ACTIVE
            if row.joined_at is None:
                row.joined_at = utcnow()

    _upsert_member(manager, "manager@digitallab.test", MEMBER_ROLE_MANAGER, "Игорь", "Петров")
    _upsert_member(viewer, "viewer@digitallab.test", MEMBER_ROLE_VIEWER, "Мария", "Козлова")

    pending = (
        db.query(CompanyMember)
        .filter(CompanyMember.invite_token == SEED_PENDING_INVITE_TOKEN)
        .first()
    )
    if pending is None:
        pending = (
            db.query(CompanyMember)
            .filter(CompanyMember.company_id == company.id, CompanyMember.email == "pending@example.com")
            .first()
        )
    if pending is None:
        db.add(
            CompanyMember(
                company_id=company.id,
                user_id=None,
                first_name="Алексей",
                last_name="Новиков",
                email="pending@example.com",
                member_role=MEMBER_ROLE_MANAGER,
                status=MEMBER_STATUS_INVITED,
                invite_token=SEED_PENDING_INVITE_TOKEN,
                invited_by_user_id=owner.id,
                expires_at=utcnow() + timedelta(days=14),
                message="Добро пожаловать в DigitalLab",
            )
        )
    else:
        pending.invite_token = SEED_PENDING_INVITE_TOKEN
        pending.status = MEMBER_STATUS_INVITED
        pending.user_id = None
        pending.member_role = MEMBER_ROLE_MANAGER
        pending.email = "pending@example.com"
        if pending.expires_at is None:
            pending.expires_at = utcnow() + timedelta(days=14)

    db.flush()


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
            report_type="MISLEADING_INFORMATION",
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


def seed_webforge_workspace(db: Session) -> None:
    """GAP-07: services/cases for WebForge so proposal form can pick cases."""
    company = _company_by_name(db, "WebForge")
    owner = _user_by_max(db, SEED_BUSINESS_USER)
    if company is None or owner is None:
        return

    # Strip accidental ADMIN membership for BUSINESS_USER owner (marketplace-only)
    from .roles import MEMBER_ROLE_ADMIN

    for row in (
        db.query(CompanyMember)
        .filter(CompanyMember.company_id == company.id, CompanyMember.user_id == owner.id)
        .all()
    ):
        if owner.role == ROLE_BUSINESS_USER and row.member_role == MEMBER_ROLE_ADMIN:
            db.delete(row)

    # Enrich company profile competencies if thin
    if not company.competencies:
        company.competencies = ["react", "figma", "wordpress", "интернет-магазин", "дизайн"]
    caps = set(company.competencies or [])
    caps.update(["ui/ux", "landing", "корпоративный сайт"])
    company.competencies = sorted(caps)

    if db.query(CompanyServiceItem).filter(CompanyServiceItem.company_id == company.id).count() == 0:
        for row in [
            {
                "title": "Корпоративные сайты",
                "description": "Дизайн и вёрстка корпоративных сайтов под ключ",
                "category": "IT-разработка",
                "status": "active",
                "short_description": "Сайты для бизнеса",
                "price_min": 150_000,
                "price_max": 600_000,
                "regions": ["Санкт-Петербург", "Вся Россия"],
                "remote": True,
                "technologies": ["react", "figma", "wordpress"],
                "capabilities": ["web", "дизайн"],
                "target_industries": ["Услуги", "Ритейл"],
            },
            {
                "title": "Интернет-магазины",
                "description": "Витрины, корзина, оплата, каталог",
                "category": "IT-разработка",
                "status": "active",
                "short_description": "E-commerce",
                "price_min": 200_000,
                "price_max": 800_000,
                "regions": ["Вся Россия"],
                "remote": True,
                "technologies": ["react", "wordpress"],
                "capabilities": ["интернет-магазин"],
                "target_industries": ["Ритейл", "Производство"],
            },
            {
                "title": "UI/UX дизайн",
                "description": "Прототипы и дизайн-системы в Figma",
                "category": "Дизайн",
                "status": "active",
                "short_description": "Figma-дизайн",
                "price_min": 80_000,
                "price_max": 350_000,
                "regions": ["Санкт-Петербург", "Вся Россия"],
                "remote": True,
                "technologies": ["figma"],
                "capabilities": ["дизайн", "ui/ux"],
                "target_industries": ["IT", "Услуги"],
            },
        ]:
            db.add(CompanyServiceItem(company_id=company.id, **row))

    if db.query(CompanyCaseItem).filter(CompanyCaseItem.company_id == company.id).count() == 0:
        for row in [
            {
                "title": "Сайт кафе с доставкой",
                "industry": "HoReCa",
                "description": "WordPress, меню, доставка",
                "result": "Заказы online +40%",
                "technologies": ["wordpress", "figma"],
                "status": "published",
                "client_name": "Кафе Север",
                "client_visible": True,
                "solution": "WordPress + доставка",
                "start_date": "2023-06-01",
                "end_date": "2023-06-21",
            },
            {
                "title": "Редизайн интернет-магазина",
                "industry": "Ритейл",
                "description": "Figma + React витрина",
                "result": "Конверсия +18%",
                "technologies": ["react", "figma"],
                "status": "published",
                "client_name": "ShopLine",
                "client_visible": True,
                "start_date": "2024-01-10",
                "end_date": "2024-03-01",
            },
            {
                "title": "Лендинг IT-продукта",
                "industry": "IT",
                "description": "Одностраничник с формой заявок",
                "result": "CPL −25%",
                "technologies": ["react", "figma"],
                "status": "published",
                "client_name": "SaaS Co",
                "client_visible": True,
            },
        ]:
            db.add(CompanyCaseItem(company_id=company.id, **row))
    db.commit()


def seed_webforge_customer_demo(db: Session) -> None:
    """GAP-02: WebForge-owned published opportunity + inbound proposals."""
    from .config import get_settings
    from .matching import match_company
    from .models import RequestMatch
    from .structurizer import structure_request

    webforge = _company_by_name(db, "WebForge")
    digital = _company_by_name(db, "DigitalLab")
    marketlab = _company_by_name(db, "МаркетЛаб")
    owner_web = _user_by_max(db, SEED_BUSINESS_USER)
    if webforge is None or owner_web is None:
        return

    title = "Редизайн корпоративного сайта"
    opp = db.query(Request).filter(Request.company_id == webforge.id, Request.title == title).first()
    if opp is None:
        description = (
            "Нужен редизайн корпоративного сайта компании. "
            "React, современный UI, адаптив, бюджет 300-500 тысяч рублей, срок полтора месяца, Санкт-Петербург."
        )
        structured = structure_request(description)
        opp = Request(
            company_id=webforge.id,
            title=title,
            description_raw=description,
            category=structured["category"] or "IT-разработка",
            subcategory=structured.get("subcategory"),
            requirements=structured.get("requirements") or ["react", "адаптив", "ui"],
            budget_min=structured.get("budget_min") or 300_000,
            budget_max=structured.get("budget_max") or 500_000,
            deadline_days=structured.get("deadline_days") or 45,
            regions=structured.get("regions") or ["Санкт-Петербург", "Вся Россия"],
            proposals_deadline_days=14,
            status="draft",
        )
        db.add(opp)
        db.commit()
        db.refresh(opp)
        publish_request(db, opp)

        # Matches without notifications
        settings = get_settings()
        for company in db.query(Company).filter(Company.id != webforge.id).all():
            score, criteria = match_company(opp, company)
            if score < settings.min_match_score:
                continue
            db.add(
                RequestMatch(
                    request_id=opp.id,
                    company_id=company.id,
                    score=score,
                    criteria=[c.as_dict() for c in criteria],
                )
            )
        db.commit()

    # Ensure APPROVED moderation item
    mod_item = (
        db.query(ModerationItem)
        .filter(ModerationItem.entity_type == "opportunity", ModerationItem.entity_id == str(opp.id))
        .first()
    )
    if mod_item is None:
        db.add(
            ModerationItem(
                entity_type="opportunity",
                entity_id=str(opp.id),
                title=opp.title,
                owner_id=str(owner_web.id),
                owner_name="Ольга Ветрова",
                company_name=webforge.name,
                status="APPROVED",
                priority="NORMAL",
                reason="NEW_OPPORTUNITY",
                summary=(opp.description_raw or "")[:500],
                moderator_note="Одобрено (seed)",
            )
        )
    elif mod_item.status not in {"APPROVED", "REJECTED", "BLOCKED"}:
        mod_item.status = "APPROVED"
        mod_item.moderator_note = mod_item.moderator_note or "Одобрено (seed)"

    # Inbound proposals (viewed) from other companies — empty shortlist for UI demo
    if digital is not None:
        if (
            db.query(Proposal)
            .filter(Proposal.request_id == opp.id, Proposal.company_id == digital.id)
            .count()
            == 0
        ):
            db.add(
                Proposal(
                    request_id=opp.id,
                    company_id=digital.id,
                    price=420_000,
                    term_days=40,
                    solution_text="React SPA + дизайн-система, поэтапная сдача",
                    case_ref="B2B-портал для дистрибьютора",
                    comment="Готовы стартовать через неделю",
                    status="viewed",
                    viewed_at=utcnow(),
                )
            )
    techflow = _company_by_name(db, "ПечатьЦентр")  # fallback other company if no TechFlow
    # Prefer another IT company: МаркетЛаб as second bidder if present, else ПечатьЦентр skip
    second = marketlab
    if second is not None:
        if (
            db.query(Proposal)
            .filter(Proposal.request_id == opp.id, Proposal.company_id == second.id)
            .count()
            == 0
        ):
            db.add(
                Proposal(
                    request_id=opp.id,
                    company_id=second.id,
                    price=380_000,
                    term_days=35,
                    solution_text="Редизайн + SEO-лендинг, контент-блоки",
                    case_ref="SMM для сети пекарен",
                    status="viewed",
                    viewed_at=utcnow(),
                )
            )
    # Third: ЛогистикГрупп won't fit — use СтройКомплект skip; add МебельПро? better find Tech-ish
    # Use existing company СтройКомплект only if we need 3 — DigitalLab + MarketLab is enough
    _ = techflow
    db.commit()


def seed_wave_a_extras(db: Session) -> None:
    from .services import enqueue_moderation_for_request

    # Backfill moderation for already-published opportunities
    for req in db.query(Request).filter(Request.status == "published").all():
        enqueue_moderation_for_request(db, req)

    seed_dictionaries(db)
    seed_digital_lab_workspace(db)
    seed_webforge_workspace(db)
    seed_marketplace_graph(db)
    seed_webforge_customer_demo(db)
    seed_moderation_demo(db)

    # Normalize any leftover MISLEADING report types
    for r in db.query(Report).filter(Report.report_type == "MISLEADING").all():
        r.report_type = "MISLEADING_INFORMATION"
    db.commit()
