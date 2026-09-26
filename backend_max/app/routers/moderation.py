from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import require_moderator
from ..models import Escalation, ModerationItem, Report, User, utcnow
from ..schemas import (
    EscalationOut,
    ModerationDashboardOut,
    ModerationDecisionIn,
    ModerationItemOut,
    ReportOut,
    ResolveReportIn,
)
from ..services import append_audit

router = APIRouter(tags=["moderation"])


def _item_out(item: ModerationItem) -> ModerationItemOut:
    return ModerationItemOut(
        id=item.id,
        entity_type=item.entity_type,
        entity_id=item.entity_id,
        title=item.title,
        owner_id=item.owner_id,
        owner_name=item.owner_name,
        company_name=item.company_name,
        status=item.status,
        priority=item.priority,
        reason=item.reason,
        summary=item.summary,
        payload=item.payload or {},
        checklist=item.checklist or [],
        related_report_ids=[str(x) for x in (item.related_report_ids or [])],
        automated_flags=item.automated_flags or [],
        data_origin=item.data_origin,
        moderator_note=item.moderator_note,
        assigned_moderator_id=item.assigned_moderator_id,
        assigned_moderator_name=item.assigned_moderator_name,
        reports_count=item.reports_count or 0,
        version=item.version or 1,
        submitted_at=item.submitted_at,
        created_at=item.created_at,
        updated_at=item.updated_at,
        current_snapshot=item.payload or {},
    )


def _report_out(r: Report) -> ReportOut:
    return ReportOut(
        id=r.id,
        reporter_id=r.reporter_id,
        reporter_name=r.reporter_name,
        target_type=r.target_type,
        target_id=r.target_id,
        target_name=r.target_name,
        type=r.report_type,
        description=r.description,
        status=r.status,
        priority=r.priority,
        created_at=r.created_at,
        resolved_at=r.resolved_at,
        resolved_by=r.resolved_by,
        resolution=r.resolution,
        resolution_code=r.resolution_code,
        assigned_moderator_id=r.assigned_moderator_id,
        related_report_ids=[str(x) for x in (r.related_report_ids or [])],
    )


def _mod_name(user: User) -> str:
    return f"{user.first_name or ''} {user.last_name or ''}".strip() or f"mod-{user.id}"


@router.get("/moderation/dashboard", response_model=ModerationDashboardOut)
def dashboard(user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    pending = db.query(ModerationItem).filter(ModerationItem.status.in_(["PENDING", "IN_REVIEW"])).all()
    by_type = {"company": 0, "opportunity": 0, "case": 0, "document": 0}
    for p in pending:
        if p.entity_type in by_type:
            by_type[p.entity_type] += 1
    open_reports = db.query(Report).filter(Report.status.in_(["OPEN", "IN_PROGRESS"])).count()
    escalations = db.query(Escalation).filter(Escalation.status == "OPEN").count()
    recent = sorted(pending, key=lambda x: x.updated_at, reverse=True)[:10]
    return ModerationDashboardOut(
        pending_companies=by_type["company"],
        pending_opportunities=by_type["opportunity"],
        pending_cases=by_type["case"],
        pending_documents=by_type["document"],
        pending_total=len(pending),
        open_reports=open_reports,
        escalations=escalations,
        attention_items=[_item_out(i) for i in recent[:5]],
        recent_queue=[_item_out(i) for i in recent],
    )


@router.get("/moderation/queue", response_model=list[ModerationItemOut])
def queue(
    status_filter: str | None = Query(default=None, alias="status"),
    user: User = Depends(require_moderator),
    db: Session = Depends(get_db),
):
    q = db.query(ModerationItem)
    if status_filter and status_filter != "all":
        q = q.filter(ModerationItem.status == status_filter)
    else:
        q = q.filter(ModerationItem.status.in_(["PENDING", "IN_REVIEW", "NEEDS_CHANGES", "ESCALATED"]))
    return [_item_out(i) for i in q.order_by(ModerationItem.updated_at.desc()).limit(100).all()]


@router.get("/moderation/items/{item_id}", response_model=ModerationItemOut)
def get_item(item_id: int, user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    item = db.get(ModerationItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Элемент не найден")
    return _item_out(item)


@router.post("/moderation/items/{item_id}/assign", response_model=ModerationItemOut)
def assign(item_id: int, user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    item = db.get(ModerationItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Элемент не найден")
    item.assigned_moderator_id = user.id
    item.assigned_moderator_name = _mod_name(user)
    item.status = "IN_REVIEW"
    db.commit()
    db.refresh(item)
    return _item_out(item)


def _decide(item: ModerationItem, new_status: str, payload: ModerationDecisionIn, user: User, db: Session):
    if payload.expected_version is not None and payload.expected_version != item.version:
        raise HTTPException(status.HTTP_409_CONFLICT, "Версия устарела")
    item.status = new_status
    item.moderator_note = payload.private_note or payload.comment
    item.version = (item.version or 1) + 1
    item.assigned_moderator_id = user.id
    item.assigned_moderator_name = _mod_name(user)
    db.commit()
    db.refresh(item)
    append_audit(
        db,
        actor=user,
        action=f"moderation.{new_status.lower()}",
        entity_type="moderation_item",
        entity_id=str(item.id),
        entity_name=item.title,
        reason=payload.reason_code or payload.comment,
    )
    return _item_out(item)


@router.post("/moderation/items/{item_id}/approve", response_model=ModerationItemOut)
def approve(item_id: int, payload: ModerationDecisionIn | None = None, user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    item = db.get(ModerationItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Элемент не найден")
    return _decide(item, "APPROVED", payload or ModerationDecisionIn(), user, db)


@router.post("/moderation/items/{item_id}/reject", response_model=ModerationItemOut)
def reject(item_id: int, payload: ModerationDecisionIn, user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    item = db.get(ModerationItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Элемент не найден")
    return _decide(item, "REJECTED", payload, user, db)


@router.post("/moderation/items/{item_id}/request-changes", response_model=ModerationItemOut)
def request_changes(item_id: int, payload: ModerationDecisionIn, user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    item = db.get(ModerationItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Элемент не найден")
    return _decide(item, "NEEDS_CHANGES", payload, user, db)


@router.post("/moderation/items/{item_id}/block", response_model=ModerationItemOut)
def block_item(item_id: int, payload: ModerationDecisionIn, user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    item = db.get(ModerationItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Элемент не найден")
    return _decide(item, "BLOCKED", payload, user, db)


@router.post("/moderation/items/{item_id}/escalate", response_model=EscalationOut)
def escalate_item(item_id: int, payload: ModerationDecisionIn, user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    item = db.get(ModerationItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Элемент не найден")
    item.status = "ESCALATED"
    esc = Escalation(
        moderation_item_id=item.id,
        title=item.title,
        reason=payload.comment or payload.reason_code or "Escalated",
        status="OPEN",
        created_by_id=user.id,
    )
    db.add(esc)
    db.commit()
    db.refresh(esc)
    return EscalationOut(
        id=esc.id,
        moderation_item_id=esc.moderation_item_id,
        report_id=esc.report_id,
        title=esc.title,
        reason=esc.reason,
        status=esc.status,
        created_at=esc.created_at,
        resolved_at=esc.resolved_at,
    )


@router.get("/moderation/history", response_model=list[ModerationItemOut])
def history(user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    rows = (
        db.query(ModerationItem)
        .filter(ModerationItem.status.in_(["APPROVED", "REJECTED", "BLOCKED", "NEEDS_CHANGES"]))
        .order_by(ModerationItem.updated_at.desc())
        .limit(100)
        .all()
    )
    return [_item_out(i) for i in rows]


@router.get("/reports", response_model=list[ReportOut])
def list_reports(
    status_filter: str | None = Query(default=None, alias="status"),
    user: User = Depends(require_moderator),
    db: Session = Depends(get_db),
):
    q = db.query(Report)
    if status_filter and status_filter not in {"all", "open_tab", "in_progress_tab", "closed_tab", "escalated_tab"}:
        q = q.filter(Report.status == status_filter)
    elif status_filter == "open_tab":
        q = q.filter(Report.status == "OPEN")
    elif status_filter == "in_progress_tab":
        q = q.filter(Report.status == "IN_PROGRESS")
    elif status_filter == "closed_tab":
        q = q.filter(Report.status.in_(["RESOLVED", "CLOSED"]))
    elif status_filter == "escalated_tab":
        q = q.filter(Report.status == "ESCALATED")
    return [_report_out(r) for r in q.order_by(Report.created_at.desc()).limit(100).all()]


@router.get("/reports/{report_id}", response_model=ReportOut)
def get_report(report_id: int, user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    r = db.get(Report, report_id)
    if r is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Жалоба не найдена")
    return _report_out(r)


@router.post("/reports/{report_id}/assign", response_model=ReportOut)
def assign_report(report_id: int, user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    r = db.get(Report, report_id)
    if r is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Жалоба не найдена")
    r.assigned_moderator_id = user.id
    r.status = "IN_PROGRESS"
    db.commit()
    db.refresh(r)
    return _report_out(r)


@router.post("/reports/{report_id}/resolve", response_model=ReportOut)
def resolve_report(report_id: int, payload: ResolveReportIn, user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    r = db.get(Report, report_id)
    if r is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Жалоба не найдена")
    r.status = "RESOLVED"
    r.resolution_code = payload.resolution_code
    r.resolution = payload.comment
    r.resolved_by = _mod_name(user)
    r.resolved_at = utcnow()
    db.commit()
    db.refresh(r)
    return _report_out(r)


@router.post("/reports/{report_id}/escalate", response_model=EscalationOut)
def escalate_report(report_id: int, comment: str | None = None, user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    r = db.get(Report, report_id)
    if r is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Жалоба не найдена")
    r.status = "ESCALATED"
    esc = Escalation(report_id=r.id, title=r.target_name or f"Report {r.id}", reason=comment or "", status="OPEN", created_by_id=user.id)
    db.add(esc)
    db.commit()
    db.refresh(esc)
    return EscalationOut(id=esc.id, moderation_item_id=None, report_id=esc.report_id, title=esc.title, reason=esc.reason, status=esc.status, created_at=esc.created_at, resolved_at=None)


@router.get("/escalations", response_model=list[EscalationOut])
def list_escalations(user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    rows = db.query(Escalation).order_by(Escalation.created_at.desc()).limit(100).all()
    return [
        EscalationOut(
            id=e.id,
            moderation_item_id=e.moderation_item_id,
            report_id=e.report_id,
            title=e.title,
            reason=e.reason,
            status=e.status,
            created_at=e.created_at,
            resolved_at=e.resolved_at,
        )
        for e in rows
    ]


@router.get("/escalations/{escalation_id}", response_model=EscalationOut)
def get_escalation(escalation_id: int, user: User = Depends(require_moderator), db: Session = Depends(get_db)):
    e = db.get(Escalation, escalation_id)
    if e is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Эскалация не найдена")
    return EscalationOut(
        id=e.id,
        moderation_item_id=e.moderation_item_id,
        report_id=e.report_id,
        title=e.title,
        reason=e.reason,
        status=e.status,
        created_at=e.created_at,
        resolved_at=e.resolved_at,
    )
