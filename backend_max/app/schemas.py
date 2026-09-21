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
    is_admin: bool = False
    created_at: datetime
    company_id: int | None = None


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
