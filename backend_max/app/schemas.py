from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


# ---------- auth ----------


class AuthInitIn(BaseModel):
    init_data: str | None = None
    dev_max_user_id: int | None = None
    dev_first_name: str | None = None
    dev_last_name: str | None = None
    dev_username: str | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    max_user_id: int
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    email: str | None = None
    role: str = "BUSINESS_USER"
    is_admin: bool = False
    status: str = "active"
    created_at: datetime
    company_id: int | None = None
    last_active_at: datetime | None = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- company ----------


class CaseIn(BaseModel):
    title: str
    description: str = ""


class CompanyIn(BaseModel):
    name: str
    inn: str | None = None
    description: str | None = None
    industries: list[str] = Field(default_factory=list)
    services: list[str] = Field(default_factory=list)
    competencies: list[str] = Field(default_factory=list)
    regions: list[str] = Field(default_factory=list)
    budget_min: int | None = None
    budget_max: int | None = None
    max_term_days: int | None = None
    cases: list[CaseIn] = Field(default_factory=list)
    certificates: list[str] = Field(default_factory=list)
    website: str | None = None
    phone: str | None = None
    email: str | None = None
    registration_date: date | None = None
    company_status: str | None = None
    verification_source: str | None = None


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    inn: str | None = None
    description: str | None = None
    industries: list[str] = Field(default_factory=list)
    services: list[str] = Field(default_factory=list)
    competencies: list[str] = Field(default_factory=list)
    regions: list[str] = Field(default_factory=list)
    budget_min: int | None = None
    budget_max: int | None = None
    max_term_days: int | None = None
    cases: list[dict] = Field(default_factory=list)
    certificates: list[str] = Field(default_factory=list)
    website: str | None = None
    phone: str | None = None
    email: str | None = None
    registration_date: date | None = None
    company_status: str | None = None
    verification_source: str | None = None
    rating: float = 0.0
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime


class CompanyPatchIn(BaseModel):
    name: str | None = None
    inn: str | None = None
    description: str | None = None
    industries: list[str] | None = None
    services: list[str] | None = None
    competencies: list[str] | None = None
    regions: list[str] | None = None
    budget_min: int | None = None
    budget_max: int | None = None
    max_term_days: int | None = None
    cases: list[CaseIn] | None = None
    certificates: list[str] | None = None
    website: str | None = None
    phone: str | None = None
    email: str | None = None
    registration_date: date | None = None
    company_status: str | None = None
    verification_source: str | None = None


class CompanyStatsOut(CompanyOut):
    active_requests: int = 0
    proposals_count: int = 0


# ---------- request ----------


class RequestCreateIn(BaseModel):
    description: str | None = None
    title: str | None = None
    category: str | None = None
    subcategory: str | None = None
    requirements: list[str] = Field(default_factory=list)
    required_certificates: list[str] = Field(default_factory=list)
    budget_min: int | None = None
    budget_max: int | None = None
    deadline_days: int | None = None
    regions: list[str] = Field(default_factory=list)
    proposals_deadline_days: int | None = None
    publish: bool = True


class StructuredRequestOut(BaseModel):
    title: str
    category: str
    subcategory: str | None = None
    requirements: list[str] = Field(default_factory=list)
    required_certificates: list[str] = Field(default_factory=list)
    budget_min: int | None = None
    budget_max: int | None = None
    deadline_days: int | None = None
    regions: list[str] = Field(default_factory=list)
    extracted: dict = Field(default_factory=dict)


class RequestPatchIn(BaseModel):
    title: str | None = None
    description_raw: str | None = None
    category: str | None = None
    subcategory: str | None = None
    requirements: list[str] | None = None
    required_certificates: list[str] | None = None
    budget_min: int | None = None
    budget_max: int | None = None
    deadline_days: int | None = None
    regions: list[str] | None = None
    proposals_deadline_days: int | None = None


class RequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    company_name: str = ""
    title: str
    description_raw: str | None = None
    category: str
    subcategory: str | None = None
    requirements: list[str] = Field(default_factory=list)
    required_certificates: list[str] = Field(default_factory=list)
    budget_min: int | None = None
    budget_max: int | None = None
    deadline_days: int | None = None
    regions: list[str] = Field(default_factory=list)
    proposals_deadline_days: int = 14
    status: str
    created_at: datetime
    published_at: datetime | None = None
    expires_at: datetime | None = None
    proposals_count: int = 0
    match_count: int = 0
    days_left: int | None = None


class CriterionOut(BaseModel):
    key: str
    label: str
    passed: bool
    detail: str


class MatchOut(BaseModel):
    id: int
    company_id: int
    company_name: str
    score: int
    criteria: list[CriterionOut] = Field(default_factory=list)
    feedback: bool | None = None


class ProposalIn(BaseModel):
    price: int
    term_days: int
    solution_text: str
    case_ref: str | None = None
    comment: str | None = None


class ProposalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_id: int
    request_title: str = ""
    company_id: int
    company_name: str = ""
    price: int
    term_days: int
    solution_text: str
    case_ref: str | None = None
    comment: str | None = None
    status: str
    created_at: datetime
    viewed_at: datetime | None = None


class ProposalStatusIn(BaseModel):
    status: str


class FeedbackIn(BaseModel):
    positive: bool


class ShortlistIn(BaseModel):
    company_id: int | None = None
    proposal_id: int | None = None


class DealCreateIn(BaseModel):
    opportunity_id: int
    proposal_id: int


class DealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    opportunity_id: int
    proposal_id: int
    customer_company_id: int
    executor_company_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    opportunity_title: str = ""
    proposal: ProposalOut | None = None
    files: list["FileOut"] = Field(default_factory=list)
    next_action: str = ""


class FileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    content_type: str | None = None
    size: int = 0
    opportunity_id: int | None = None
    deal_id: int | None = None
    created_at: datetime


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    ok: bool = False
    is_read: bool = False
    created_at: datetime


class RequestDetailOut(RequestOut):
    matches: list[MatchOut] = Field(default_factory=list)
    proposals: list[ProposalOut] = Field(default_factory=list)


# ---------- compare / dealroom / feed ----------


class CompareRowOut(BaseModel):
    company_id: int
    company_name: str
    rating: float = 0.0
    cases_count: int = 0
    requirements_met: str = "0/0"
    match_score: int = 0
    price: int | None = None
    term_days: int | None = None
    status: str = ""


class CompareOut(BaseModel):
    request_id: int
    request_title: str
    requirements: list[str] = Field(default_factory=list)
    rows: list[CompareRowOut] = Field(default_factory=list)


class DealRoomOut(BaseModel):
    request: RequestOut
    proposals: list[ProposalOut] = Field(default_factory=list)
    shortlist: list[ProposalOut] = Field(default_factory=list)
    files: list[FileOut] = Field(default_factory=list)
    next_action: str


class ShareOut(BaseModel):
    sent: bool
    mid: str | None = None
    chat_type: str = "DIALOG"
    text: str
    error: str | None = None


class ShareLinkOut(BaseModel):
    url: str


class FeedItemOut(BaseModel):
    match_id: int
    request: RequestOut
    score: int
    criteria: list[CriterionOut] = Field(default_factory=list)
    feedback: bool | None = None


class DashboardOut(BaseModel):
    mode: str
    feed: list[FeedItemOut] = Field(default_factory=list)
    my_requests: list[RequestOut] = Field(default_factory=list)
    recent_proposals: list[ProposalOut] = Field(default_factory=list)
    top_companies: list[MatchOut] = Field(default_factory=list)


# ---------- dictionaries / admin ----------


class CategoryOut(BaseModel):
    name: str
    services: list[str] = Field(default_factory=list)


class DictionariesOut(BaseModel):
    categories: list[CategoryOut] = Field(default_factory=list)
    regions: list[str] = Field(default_factory=list)
    budget_ranges: list[dict] = Field(default_factory=list)
    deadline_presets: list[dict] = Field(default_factory=list)


class StatsOut(BaseModel):
    users: int = 0
    companies: int = 0
    requests: int = 0
    published_requests: int = 0
    proposals: int = 0
    matches: int = 0
    notifications: int = 0


class ModerateIn(BaseModel):
    action: str  # publish | block | close | reopen


class VerifyIn(BaseModel):
    verified: bool = True


class NotificationLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None = None
    target_user_id: int | None = None
    text: str
    ok: bool
    error: str | None = None
    is_read: bool = False
    created_at: datetime


# ---------- favorites / invites / company workspace ----------


class FavoriteOut(BaseModel):
    id: int
    type: str
    target_id: int
    created_at: datetime


class FavoriteToggleIn(BaseModel):
    type: str  # company | opportunity
    target_id: int


class FavoriteToggleOut(BaseModel):
    favorited: bool
    item: FavoriteOut | None = None


class OpportunityInviteOut(BaseModel):
    id: int
    opportunity_id: int
    opportunity_title: str = ""
    company_id: int
    company_name: str = ""
    created_at: datetime


class OpportunityInviteIn(BaseModel):
    company_id: int


class CompanyMemberOut(BaseModel):
    id: int
    user_id: int | None = None
    company_id: int
    first_name: str
    last_name: str
    email: str
    role: str
    status: str
    invited_at: datetime
    joined_at: datetime | None = None
    last_active_at: datetime | None = None


class CompanyMemberInviteIn(BaseModel):
    email: str
    first_name: str
    last_name: str
    role: str = "MANAGER"
    message: str | None = None


class CompanyMemberPatchIn(BaseModel):
    role: str | None = None
    status: str | None = None


class ServiceOut(BaseModel):
    id: int
    company_id: int
    title: str
    description: str = ""
    category: str = ""
    status: str = "draft"
    short_description: str | None = None
    price_min: int | None = None
    price_max: int | None = None
    currency: str = "RUB"
    regions: list[str] = Field(default_factory=list)
    remote: bool = False
    technologies: list[str] = Field(default_factory=list)
    capabilities: list[str] = Field(default_factory=list)
    target_industries: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ServiceIn(BaseModel):
    title: str
    description: str = ""
    category: str = ""
    status: str | None = "draft"
    short_description: str | None = None
    price_min: int | None = None
    price_max: int | None = None
    currency: str | None = "RUB"
    regions: list[str] | None = None
    remote: bool | None = None
    technologies: list[str] | None = None
    capabilities: list[str] | None = None
    target_industries: list[str] | None = None


class CaseItemOut(BaseModel):
    id: int
    company_id: int
    title: str
    industry: str = ""
    description: str = ""
    result: str = ""
    technologies: list[str] = Field(default_factory=list)
    status: str = "draft"
    client_name: str | None = None
    client_visible: bool = False
    solution: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    cover_url: str | None = None
    external_url: str | None = None
    capabilities: list[str] = Field(default_factory=list)


class CaseItemIn(BaseModel):
    title: str
    industry: str = ""
    description: str = ""
    result: str = ""
    technologies: list[str] = Field(default_factory=list)
    status: str | None = "draft"
    client_name: str | None = None
    client_visible: bool | None = None
    solution: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    cover_url: str | None = None
    external_url: str | None = None
    capabilities: list[str] | None = None


class DocumentItemOut(BaseModel):
    id: int
    company_id: int
    name: str
    type: str = ""
    file_name: str = ""
    status: str = "Pending"
    number: str | None = None
    issuer: str | None = None
    issued_at: str | None = None
    expires_at: str | None = None
    file_url: str | None = None
    verification_source: str = "COMPANY_DATA"
    uploaded_at: datetime
    updated_at: datetime


class DocumentItemIn(BaseModel):
    name: str
    type: str = ""
    file_name: str = ""
    number: str | None = None
    issuer: str | None = None
    issued_at: str | None = None
    expires_at: str | None = None
    file_url: str | None = None
    verification_source: str | None = None


class CompanySettingsOut(BaseModel):
    company_id: int
    notifications: dict = Field(default_factory=dict)
    visibility: dict = Field(default_factory=dict)
    matching: dict = Field(default_factory=dict)
    archived: bool = False


class CompanySettingsPatchIn(BaseModel):
    notifications: dict | None = None
    visibility: dict | None = None
    matching: dict | None = None
    archived: bool | None = None


class VerificationBlockOut(BaseModel):
    id: str
    label: str
    status: str
    source: str
    description: str | None = None


class CompanyVerificationOut(BaseModel):
    company_id: int
    status: str
    blocks: list[VerificationBlockOut] = Field(default_factory=list)
    updated_at: datetime


class ActivityOut(BaseModel):
    id: int
    company_id: int
    type: str
    actor_name: str
    action: str
    entity_label: str | None = None
    created_at: datetime


class ModerationItemOut(BaseModel):
    id: int
    entity_type: str
    entity_id: str
    title: str
    owner_id: str | None = None
    owner_name: str | None = None
    company_name: str | None = None
    status: str
    priority: str = "NORMAL"
    reason: str = ""
    summary: str | None = None
    payload: dict = Field(default_factory=dict)
    checklist: list[str] = Field(default_factory=list)
    related_report_ids: list[str] = Field(default_factory=list)
    automated_flags: list[str] = Field(default_factory=list)
    data_origin: str = "USER"
    moderator_note: str | None = None
    assigned_moderator_id: int | None = None
    assigned_moderator_name: str | None = None
    reports_count: int = 0
    version: int = 1
    submitted_at: datetime
    created_at: datetime
    updated_at: datetime
    previous_snapshot: dict | None = None
    current_snapshot: dict | None = None
    document_status: str | None = None
    previous_decision_id: str | None = None


class ModerationDashboardOut(BaseModel):
    pending_companies: int = 0
    pending_opportunities: int = 0
    pending_cases: int = 0
    pending_documents: int = 0
    pending_total: int = 0
    open_reports: int = 0
    escalations: int = 0
    today_processed: int = 0
    approved_today: int = 0
    rejected_today: int = 0
    changes_today: int = 0
    attention_items: list[ModerationItemOut] = Field(default_factory=list)
    recent_queue: list[ModerationItemOut] = Field(default_factory=list)


class ModerationDecisionIn(BaseModel):
    reason_code: str | None = None
    comment: str | None = None
    private_note: str | None = None
    expected_version: int | None = None


class ReportOut(BaseModel):
    id: int
    reporter_id: int | None = None
    reporter_name: str = ""
    target_type: str
    target_id: str
    target_name: str = ""
    type: str
    description: str = ""
    status: str
    priority: str = "NORMAL"
    created_at: datetime
    resolved_at: datetime | None = None
    resolved_by: str | None = None
    resolution: str | None = None
    resolution_code: str | None = None
    assigned_moderator_id: int | None = None
    related_report_ids: list[str] = Field(default_factory=list)


class ResolveReportIn(BaseModel):
    resolution_code: str
    comment: str | None = None
    apply_action: str | None = "none"


class EscalationOut(BaseModel):
    id: int
    moderation_item_id: int | None = None
    report_id: int | None = None
    title: str
    reason: str = ""
    status: str
    created_at: datetime
    resolved_at: datetime | None = None


class AuditEventOut(BaseModel):
    id: int
    actor_id: str | None = None
    actor_name: str = ""
    actor_role: str = ""
    action: str
    entity_type: str = ""
    entity_id: str = ""
    entity_name: str = ""
    reason: str | None = None
    before: dict | None = None
    after: dict | None = None
    details: dict | None = None
    created_at: datetime


class FeatureFlagOut(BaseModel):
    id: int
    key: str
    name: str
    description: str = ""
    enabled: bool = False
    scope: str = "GLOBAL"
    updated_by: str | None = None
    updated_at: datetime


class PlatformSettingsOut(BaseModel):
    general: dict = Field(default_factory=dict)
    moderation: dict = Field(default_factory=dict)
    matching: dict = Field(default_factory=dict)
    notifications: dict = Field(default_factory=dict)
    maintenance: dict = Field(default_factory=dict)
    announcement: dict = Field(default_factory=dict)


class DictionaryItemOut(BaseModel):
    id: int
    type: str
    name: str
    slug: str
    parent_id: int | None = None
    aliases: list[str] = Field(default_factory=list)
    status: str = "active"
    sort_order: int = 0
    category: str | None = None
    description: str | None = None
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime


class DictionaryItemIn(BaseModel):
    type: str
    name: str
    slug: str | None = None
    parent_id: int | None = None
    aliases: list[str] | None = None
    status: str | None = "active"
    sort_order: int | None = 0
    category: str | None = None
    description: str | None = None


class AdminUserOut(BaseModel):
    id: int
    max_user_id: int
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    system_role: str
    status: str
    company_id: int | None = None
    company_name: str | None = None
    created_at: datetime
    last_active_at: datetime | None = None


class AdminUserRoleIn(BaseModel):
    new_role: str
    reason: str = ""


class AdminCompanyOut(BaseModel):
    id: int
    name: str
    inn: str | None = None
    description: str | None = None
    region: str = ""
    industries: list[str] = Field(default_factory=list)
    platform_status: str = "ACTIVE"
    verification_status: str = "NOT_VERIFIED"
    is_verified: bool = False
    members_count: int = 0
    created_at: datetime
    updated_at: datetime


class AdminCompanyStatusIn(BaseModel):
    platform_status: str
    reason: str | None = None


class AnalyticsOverviewOut(BaseModel):
    users_total: int = 0
    companies_total: int = 0
    opportunities_open: int = 0
    deals_active: int = 0
    matches_this_month: int = 0
    moderation_pending: int = 0
    open_reports: int = 0
    proposals: int = 0
    is_model_data: bool = True
