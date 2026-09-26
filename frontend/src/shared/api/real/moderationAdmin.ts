import type {
  ApproveInput,
  BlockInput,
  EscalateInput,
  ModerationDashboard,
  ModerationHistoryEntry,
  ModerationItem,
  ModerationQueueFilters,
  RejectInput,
  RequestChangesInput,
} from '@/entities/moderation'
import { MODERATION_ACTION, MODERATION_STATUS } from '@/entities/moderation'
import type { Escalation, EscalationReason } from '@/entities/escalation'
import { ESCALATION_REASON, ESCALATION_STATUS } from '@/entities/escalation'
import type { Report } from '@/entities/report'
import type { SystemRole, UserStatus } from '@/entities/user'
import { SYSTEM_ROLES } from '@/entities/user'
import type { AdminUser } from '@/shared/mocks/adminUsers'
import type { AnalyticsOverview, AnalyticsPeriod } from '@/shared/mocks/analytics'
import type { AuditEvent, AuditFilters } from '@/shared/mocks/audit'
import type { DictionaryItem, DictionaryType } from '@/shared/mocks/dictionaries'
import type { FeatureFlag, FeatureFlagScope } from '@/shared/mocks/featureFlags'
import type { PlatformSettings } from '@/shared/mocks/platformSettings'
import { mockPlatformSettings } from '@/shared/mocks/platformSettings'
import { apiClient } from '@/shared/api/apiClient'
import { toApiError } from '@/shared/api/errors'

/** Local mirrors to avoid circular imports with *Api modules */
type PlatformCompanyStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'ARCHIVED'
type VerificationStatus =
  | 'NOT_VERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'REQUIRES_UPDATE'

interface AdminActor {
  id: string
  name: string
  role: SystemRole
}

interface AdminUserFilters {
  query?: string
  role?: SystemRole | 'all'
  status?: UserStatus | 'all'
  companyId?: string
  sort?: 'name' | 'created' | 'activity' | 'role' | 'status'
}

interface AdminCompanyFilters {
  query?: string
  status?: PlatformCompanyStatus | 'all'
  verification?: VerificationStatus | 'all'
  region?: string
  industry?: string
  sort?: 'name' | 'created' | 'reports' | 'status'
}

interface AdminCompany {
  id: string
  name: string
  legalName: string
  shortName: string
  inn: string
  ogrn: string
  logoUrl: string | null
  description: string
  website: string | null
  region: string
  industries: string[]
  services: string[]
  technologies: string[]
  status: PlatformCompanyStatus
  platformStatus: PlatformCompanyStatus
  verificationStatus: VerificationStatus
  membersCount: number
  employeesCount: number
  reportsCount: number
  createdAt: string
  updatedAt: string
  verified: boolean
  casesCount: number
  employees: unknown[]
  servicesList: unknown[]
  cases: unknown[]
  documents: unknown[]
  reports: unknown[]
  history: unknown[]
  verificationSource: 'Model data' | 'Test data'
}

interface DictionaryCreateInput {
  type: DictionaryType
  name: string
  slug?: string
  parentId?: string | null
  description?: string
  sortOrder?: number
  status?: 'active' | 'archived'
  aliases?: string[]
  category?: string
}

interface DictionaryUpdateInput {
  name?: string
  slug?: string
  parentId?: string | null
  description?: string
  sortOrder?: number
  aliases?: string[]
  category?: string
  status?: 'active' | 'archived'
}

/* ── DTOs ─────────────────────────────────────────────────────────── */

interface ModerationItemDto {
  id: number
  entity_type: string
  entity_id: string
  title: string
  owner_id?: string | null
  owner_name?: string | null
  company_name?: string | null
  status: string
  priority?: string
  reason?: string
  summary?: string | null
  payload?: Record<string, unknown>
  checklist?: string[]
  related_report_ids?: string[]
  automated_flags?: string[]
  data_origin?: string
  moderator_note?: string | null
  assigned_moderator_id?: number | null
  assigned_moderator_name?: string | null
  reports_count?: number
  version?: number
  submitted_at: string
  created_at: string
  updated_at: string
  previous_snapshot?: Record<string, unknown> | null
  current_snapshot?: Record<string, unknown> | null
  document_status?: string | null
  previous_decision_id?: string | null
}

interface DashboardDto {
  pending_companies: number
  pending_opportunities: number
  pending_cases: number
  pending_documents: number
  pending_total: number
  open_reports: number
  escalations: number
  today_processed?: number
  approved_today?: number
  rejected_today?: number
  changes_today?: number
  attention_items: ModerationItemDto[]
  recent_queue: ModerationItemDto[]
}

interface ReportDto {
  id: number
  reporter_id?: number | null
  reporter_name: string
  target_type: string
  target_id: string
  target_name: string
  type: string
  description: string
  status: string
  priority: string
  created_at: string
  resolved_at?: string | null
  resolved_by?: string | null
  resolution?: string | null
  resolution_code?: string | null
  assigned_moderator_id?: number | null
  related_report_ids?: string[]
}

interface EscalationDto {
  id: number
  moderation_item_id?: number | null
  report_id?: number | null
  title: string
  reason: string
  status: string
  created_at: string
  resolved_at?: string | null
}

interface AdminUserDto {
  id: number
  max_user_id: number
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  system_role: string
  status: string
  company_id?: number | null
  company_name?: string | null
  created_at: string
  last_active_at?: string | null
}

interface AdminCompanyDto {
  id: number
  name: string
  inn?: string | null
  description?: string | null
  region: string
  industries: string[]
  services?: string[]
  website?: string | null
  platform_status: string
  verification_status: string
  is_verified: boolean
  verification_source?: string | null
  members_count: number
  cases_count?: number
  documents_count?: number
  reports_count?: number
  created_at: string
  updated_at: string
  employees?: Array<{ id: string; name: string; role: string; email: string }>
  services_list?: Array<{ id: string; name: string; description: string }>
  cases?: Array<{ id: string; title: string; client: string; year: number }>
  documents?: Array<{ id: string; name: string; type: string; status: string }>
  reports?: Array<{ id: string; reason: string; status: string; createdAt: string }>
  history?: Array<{ id: string; date: string; title: string; description: string }>
}

interface DictionaryDto {
  id: number
  type: string
  name: string
  slug: string
  parent_id?: number | null
  aliases?: string[]
  status: string
  sort_order: number
  category?: string | null
  description?: string | null
  usage_count: number
  created_at: string
  updated_at: string
}

interface AnalyticsDto {
  users_total: number
  companies_total: number
  opportunities_open: number
  deals_active: number
  matches_this_month: number
  moderation_pending: number
  open_reports: number
  proposals: number
  shortlists?: number
  approved_moderation?: number
  rejected_moderation?: number
  needs_changes_moderation?: number
  escalations?: number
  avg_match_score?: number
  match_to_proposal_rate?: number
  users_prev?: number
  companies_prev?: number
  opportunities_prev?: number
  proposals_prev?: number
  is_model_data: boolean
}

interface AuditDto {
  id: number
  actor_id?: string | null
  actor_name: string
  actor_role: string
  action: string
  entity_type: string
  entity_id: string
  entity_name: string
  reason?: string | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  details?: Record<string, unknown> | null
  created_at: string
}

interface FeatureFlagDto {
  id: number
  key: string
  name: string
  description: string
  enabled: boolean
  scope: string
  updated_by?: string | null
  updated_at: string
}

interface PlatformSettingsDto {
  general: Record<string, unknown>
  moderation: Record<string, unknown>
  matching: Record<string, unknown>
  notifications: Record<string, unknown>
  maintenance: Record<string, unknown>
  announcement: Record<string, unknown>
}

/* ── mappers ──────────────────────────────────────────────────────── */

export function mapModerationItem(dto: ModerationItemDto): ModerationItem {
  return {
    id: String(dto.id),
    entityType: dto.entity_type as ModerationItem['entityType'],
    entityId: dto.entity_id,
    title: dto.title,
    ownerId: dto.owner_id ?? '',
    ownerName: dto.owner_name ?? '',
    companyName: dto.company_name ?? '',
    status: dto.status as ModerationItem['status'],
    priority: (dto.priority ?? 'NORMAL') as ModerationItem['priority'],
    reason: (dto.reason ?? 'NEW_OPPORTUNITY') as ModerationItem['reason'],
    submittedAt: dto.submitted_at,
    assignedModeratorId:
      dto.assigned_moderator_id != null ? String(dto.assigned_moderator_id) : null,
    assignedModeratorName: dto.assigned_moderator_name ?? null,
    reportsCount: dto.reports_count ?? 0,
    previousDecisionId: dto.previous_decision_id ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    summary: dto.summary ?? '',
    payload: (dto.payload ?? {}) as ModerationItem['payload'],
    checklist: dto.checklist ?? [],
    relatedReportIds: (dto.related_report_ids ?? []).map(String),
    automatedFlags: dto.automated_flags ?? [],
    dataOrigin: (dto.data_origin ?? 'USER') as ModerationItem['dataOrigin'],
    previousSnapshot: (dto.previous_snapshot as ModerationItem['previousSnapshot']) ?? null,
    currentSnapshot: (dto.current_snapshot as ModerationItem['currentSnapshot']) ?? null,
    documentStatus: (dto.document_status as ModerationItem['documentStatus']) ?? null,
    moderatorNote: dto.moderator_note ?? null,
    version: dto.version ?? 1,
  }
}

function mapDashboard(dto: DashboardDto): ModerationDashboard {
  return {
    pendingCompanies: dto.pending_companies,
    pendingOpportunities: dto.pending_opportunities,
    pendingCases: dto.pending_cases,
    pendingDocuments: dto.pending_documents,
    pendingTotal: dto.pending_total,
    openReports: dto.open_reports,
    escalations: dto.escalations,
    todayProcessed: dto.today_processed ?? 0,
    approvedToday: dto.approved_today ?? 0,
    rejectedToday: dto.rejected_today ?? 0,
    changesToday: dto.changes_today ?? 0,
    attentionItems: (dto.attention_items ?? []).map(mapModerationItem),
    recentQueue: (dto.recent_queue ?? []).map(mapModerationItem),
  }
}

export function mapReport(dto: ReportDto): Report {
  return {
    id: String(dto.id),
    reporterId: dto.reporter_id != null ? String(dto.reporter_id) : '',
    reporterName: dto.reporter_name,
    targetType: dto.target_type as Report['targetType'],
    targetId: dto.target_id,
    targetName: dto.target_name,
    type: dto.type as Report['type'],
    description: dto.description,
    status: dto.status as Report['status'],
    priority: dto.priority as Report['priority'],
    createdAt: dto.created_at,
    resolvedAt: dto.resolved_at ?? null,
    resolvedBy: dto.resolved_by ?? null,
    resolution: dto.resolution ?? null,
    resolutionCode: dto.resolution_code ?? null,
    assignedModeratorId:
      dto.assigned_moderator_id != null ? String(dto.assigned_moderator_id) : null,
    relatedReportIds: (dto.related_report_ids ?? []).map(String),
  }
}

function asEscalationReason(raw: string): EscalationReason {
  const values = Object.values(ESCALATION_REASON) as string[]
  return (values.includes(raw) ? raw : ESCALATION_REASON.OTHER) as EscalationReason
}

export function mapEscalation(dto: EscalationDto, extra?: Partial<Escalation>): Escalation {
  return {
    id: String(dto.id),
    moderationItemId:
      dto.moderation_item_id != null ? String(dto.moderation_item_id) : (extra?.moderationItemId ?? ''),
    entityType: extra?.entityType ?? 'opportunity',
    entityId: extra?.entityId ?? (dto.report_id != null ? String(dto.report_id) : ''),
    title: dto.title,
    companyName: extra?.companyName ?? '',
    moderatorId: extra?.moderatorId ?? '',
    moderatorName: extra?.moderatorName ?? '',
    reason: asEscalationReason(dto.reason),
    comment: dto.reason,
    status: (dto.status as Escalation['status']) || ESCALATION_STATUS.OPEN,
    createdAt: dto.created_at,
    resolvedAt: dto.resolved_at ?? null,
    resolution: null,
    adminResponse: null,
  }
}

function mapAdminUser(dto: AdminUserDto): AdminUser {
  const systemRole = (dto.system_role || SYSTEM_ROLES.BUSINESS_USER) as SystemRole
  return {
    id: String(dto.id),
    maxUserId: String(dto.max_user_id),
    firstName: dto.first_name ?? '',
    lastName: dto.last_name ?? '',
    email: dto.email ?? '',
    avatarUrl: null,
    systemRole,
    role: systemRole,
    status: (dto.status || 'active') as UserStatus,
    companyId: dto.company_id != null ? String(dto.company_id) : null,
    companyName: dto.company_name ?? null,
    createdAt: dto.created_at,
    lastActiveAt: dto.last_active_at ?? null,
    lastLoginAt: dto.last_active_at ?? null,
  }
}

function mapAdminCompany(dto: AdminCompanyDto): AdminCompany {
  const platformStatus = (dto.platform_status || 'ACTIVE') as PlatformCompanyStatus
  return {
    id: String(dto.id),
    name: dto.name,
    legalName: dto.name,
    shortName: dto.name,
    inn: dto.inn ?? '',
    ogrn: '',
    logoUrl: null,
    description: dto.description ?? '',
    website: dto.website ?? null,
    region: dto.region ?? '',
    industries: dto.industries ?? [],
    services: dto.services ?? [],
    technologies: [],
    status: platformStatus,
    platformStatus,
    verificationStatus: (dto.verification_status || 'NOT_VERIFIED') as VerificationStatus,
    membersCount: dto.members_count,
    employeesCount: dto.members_count,
    reportsCount: dto.reports_count ?? dto.reports?.length ?? 0,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    verified: dto.is_verified,
    casesCount: dto.cases_count ?? dto.cases?.length ?? 0,
    employees: dto.employees ?? [],
    servicesList: dto.services_list ?? [],
    cases: dto.cases ?? [],
    documents: dto.documents ?? [],
    reports: dto.reports ?? [],
    history: dto.history ?? [],
    verificationSource: dto.verification_source ? 'Test data' : 'Model data',
  }
}

function mapDictionary(dto: DictionaryDto): DictionaryItem {
  return {
    id: String(dto.id),
    type: dto.type as DictionaryType,
    name: dto.name,
    slug: dto.slug,
    parentId: dto.parent_id != null ? String(dto.parent_id) : null,
    aliases: dto.aliases ?? [],
    status: (dto.status as DictionaryItem['status']) || 'active',
    sortOrder: dto.sort_order,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    usageCount: dto.usage_count,
    category: dto.category ?? undefined,
    description: dto.description ?? undefined,
  }
}

function delta(value: number, previous: number) {
  const changePercent =
    previous === 0 ? (value > 0 ? 100 : 0) : Math.round(((value - previous) / previous) * 1000) / 10
  return { value, previousPeriod: previous, changePercent }
}

function mapAnalytics(dto: AnalyticsDto, period: AnalyticsPeriod): AnalyticsOverview {
  const usersPrev = dto.users_prev ?? dto.users_total
  const companiesPrev = dto.companies_prev ?? dto.companies_total
  const oppPrev = dto.opportunities_prev ?? dto.opportunities_open
  const propPrev = dto.proposals_prev ?? dto.proposals
  const shortlists = dto.shortlists ?? 0
  const matchRate = dto.match_to_proposal_rate ?? 0
  return {
    period,
    usersTotal: dto.users_total,
    companiesTotal: dto.companies_total,
    opportunitiesOpen: dto.opportunities_open,
    dealsActive: dto.deals_active,
    matchesThisMonth: dto.matches_this_month,
    moderationPending: dto.moderation_pending,
    openReports: dto.open_reports,
    users: delta(dto.users_total, usersPrev),
    companies: delta(dto.companies_total, companiesPrev),
    activeRequests: delta(dto.opportunities_open, oppPrev),
    proposals: delta(dto.proposals, propPrev),
    negotiations: delta(dto.deals_active, Math.max(0, Math.floor(dto.deals_active * 0.8))),
    pendingModeration: delta(dto.moderation_pending, dto.moderation_pending),
    openReportsDelta: delta(dto.open_reports, dto.open_reports),
    metrics: {
      users: dto.users_total,
      companies: dto.companies_total,
      activeOpportunities: dto.opportunities_open,
      proposals: dto.proposals,
      matches: dto.matches_this_month,
      negotiations: dto.deals_active,
      pendingModeration: dto.moderation_pending,
      reports: dto.open_reports,
    },
    funnel: [
      { label: 'Users', value: dto.users_total },
      { label: 'Companies', value: dto.companies_total },
      { label: 'Opportunities', value: dto.opportunities_open },
      { label: 'Proposals', value: dto.proposals },
      { label: 'Deals', value: dto.deals_active },
    ],
    conversions: {
      matchToProposal: Math.round(matchRate * 1000) / 10,
      proposalToShortlist: dto.proposals ? Math.round((shortlists / dto.proposals) * 1000) / 10 : 0,
      shortlistToNegotiation: shortlists
        ? Math.round((dto.deals_active / shortlists) * 1000) / 10
        : 0,
    },
    growth: {
      newUsers: delta(dto.users_total - usersPrev, usersPrev),
      newCompanies: delta(dto.companies_total - companiesPrev, companiesPrev),
      newOpportunities: delta(dto.opportunities_open - oppPrev, oppPrev),
    },
    matchQuality: {
      averageMatchScore: dto.avg_match_score ?? 0,
      matchViewedRate: 0,
      matchToProposalRate: Math.round(matchRate * 1000) / 10,
      negativeMatchFeedback: 0,
    },
    moderation: {
      pendingItems: dto.moderation_pending,
      averageQueueAgeHours: 0,
      approved: dto.approved_moderation ?? 0,
      rejected: dto.rejected_moderation ?? 0,
      needsChanges: dto.needs_changes_moderation ?? 0,
      reports: dto.open_reports,
      escalations: dto.escalations ?? 0,
    },
    createdOpportunities: dto.opportunities_open,
    publishedOpportunities: dto.opportunities_open,
    createdProposals: dto.proposals,
    shortlists,
    negotiationsCount: dto.deals_active,
    isModelData: dto.is_model_data ?? false,
  }
}

function mapAudit(dto: AuditDto): AuditEvent {
  const actorRole = (dto.actor_role || SYSTEM_ROLES.PLATFORM_ADMIN) as SystemRole
  const ts = dto.created_at
  return {
    id: String(dto.id),
    actorId: dto.actor_id ?? '',
    actorName: dto.actor_name,
    actorRole,
    role: actorRole,
    action: dto.action,
    entityType: dto.entity_type,
    entityId: dto.entity_id,
    entityName: dto.entity_name,
    entityLabel: dto.entity_name,
    before: dto.before ?? undefined,
    after: dto.after ?? undefined,
    reason: dto.reason ?? undefined,
    timestamp: ts,
    createdAt: ts,
    details: dto.details ? JSON.stringify(dto.details) : undefined,
    targetType: dto.entity_type,
    targetName: dto.entity_name,
  }
}

function mapFlag(dto: FeatureFlagDto): FeatureFlag {
  return {
    id: String(dto.id),
    key: dto.key,
    name: dto.name,
    description: dto.description,
    enabled: dto.enabled,
    scope: (dto.scope as FeatureFlagScope) || 'GLOBAL',
    updatedAt: dto.updated_at,
    updatedBy: dto.updated_by ?? '',
  }
}

function mergeSettings(dto: PlatformSettingsDto): PlatformSettings {
  const base = structuredClone(mockPlatformSettings)
  return {
    general: { ...base.general, ...(dto.general as Partial<PlatformSettings['general']>) },
    moderation: { ...base.moderation, ...(dto.moderation as Partial<PlatformSettings['moderation']>) },
    matching: { ...base.matching, ...(dto.matching as Partial<PlatformSettings['matching']>) },
    notifications: {
      ...base.notifications,
      ...(dto.notifications as Partial<PlatformSettings['notifications']>),
    },
    maintenance: {
      ...base.maintenance,
      ...(dto.maintenance as Partial<PlatformSettings['maintenance']>),
    },
    announcement: {
      ...base.announcement,
      ...(dto.announcement as Partial<PlatformSettings['announcement']>),
    },
  }
}

function decisionBody(input?: {
  reasonCode?: string
  comment?: string
  privateNote?: string
  expectedVersion?: number
  fields?: string[]
}) {
  return {
    reason_code: input?.reasonCode,
    comment: input?.comment ?? input?.fields?.join(', '),
    private_note: input?.privateNote,
    expected_version: input?.expectedVersion,
  }
}

/* ── moderation / reports / escalations ───────────────────────────── */

export const moderationReal = {
  async getDashboard(): Promise<ModerationDashboard> {
    try {
      const { data } = await apiClient.get<DashboardDto>('/moderation/dashboard')
      return mapDashboard(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getSummary(): Promise<ModerationDashboard> {
    return this.getDashboard()
  },

  async getQueue(filters?: ModerationQueueFilters): Promise<ModerationItem[]> {
    try {
      const status =
        filters?.status && filters.status !== 'all' && filters.status !== 'open'
          ? filters.status
          : undefined
      const { data } = await apiClient.get<ModerationItemDto[]>('/moderation/queue', {
        params: { status },
      })
      let items = data.map(mapModerationItem)
      if (filters?.type && filters.type !== 'all') {
        items = items.filter((i) => i.entityType === filters.type)
      }
      if (filters?.priority && filters.priority !== 'all') {
        items = items.filter((i) => i.priority === filters.priority)
      }
      if (filters?.query) {
        const q = filters.query.toLowerCase()
        items = items.filter((i) =>
          `${i.title} ${i.companyName} ${i.ownerName}`.toLowerCase().includes(q),
        )
      }
      return items
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getItem(id: string): Promise<ModerationItem> {
    try {
      const { data } = await apiClient.get<ModerationItemDto>(`/moderation/items/${id}`)
      return mapModerationItem(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getById(_type: string, id: string): Promise<ModerationItem> {
    return this.getItem(id)
  },

  async getNextItem(afterId: string, filters?: ModerationQueueFilters): Promise<ModerationItem | null> {
    const queue = await this.getQueue({ ...filters, status: filters?.status ?? 'open' })
    const idx = queue.findIndex((i) => i.id === afterId)
    const next = idx >= 0 ? queue[idx + 1] : queue[0]
    return next && next.id !== afterId ? next : queue.find((i) => i.id !== afterId) ?? null
  },

  async getRelatedData(id: string) {
    const item = await this.getItem(id)
    return {
      item,
      relatedReports: [] as Report[],
      history: [] as ModerationHistoryEntry[],
      similarTitles: [] as string[],
      companyRisk: { previousRejections: 0, reportsCount: item.reportsCount, blockedItems: 0 },
    }
  },

  async assignToMe(id: string): Promise<ModerationItem> {
    try {
      const { data } = await apiClient.post<ModerationItemDto>(`/moderation/items/${id}/assign`)
      return mapModerationItem(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async approve(id: string, input: ApproveInput = {}): Promise<ModerationItem> {
    try {
      const { data } = await apiClient.post<ModerationItemDto>(
        `/moderation/items/${id}/approve`,
        decisionBody(input),
      )
      return mapModerationItem(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async reject(id: string, input: RejectInput): Promise<ModerationItem> {
    try {
      const { data } = await apiClient.post<ModerationItemDto>(
        `/moderation/items/${id}/reject`,
        decisionBody(input),
      )
      return mapModerationItem(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async requestChanges(id: string, input: RequestChangesInput): Promise<ModerationItem> {
    try {
      const { data } = await apiClient.post<ModerationItemDto>(
        `/moderation/items/${id}/request-changes`,
        decisionBody({
          comment: input.comment,
          privateNote: input.privateNote,
          expectedVersion: input.expectedVersion,
          fields: input.fields,
        }),
      )
      return mapModerationItem(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async block(id: string, input: BlockInput): Promise<ModerationItem> {
    try {
      const { data } = await apiClient.post<ModerationItemDto>(
        `/moderation/items/${id}/block`,
        decisionBody(input),
      )
      return mapModerationItem(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async escalate(
    id: string,
    input: EscalateInput,
  ): Promise<{ item: ModerationItem; escalation: Escalation }> {
    try {
      const { data } = await apiClient.post<EscalationDto>(
        `/moderation/items/${id}/escalate`,
        decisionBody(input),
      )
      const item = await this.getItem(id)
      return {
        item,
        escalation: mapEscalation(data, {
          moderationItemId: item.id,
          entityType: item.entityType,
          entityId: item.entityId,
          companyName: item.companyName,
        }),
      }
    } catch (e) {
      throw toApiError(e)
    }
  },

  async resubmit(id: string, _patch: Record<string, unknown>): Promise<ModerationItem> {
    try {
      const { data } = await apiClient.post<ModerationItemDto>(`/moderation/items/${id}/resubmit`)
      return mapModerationItem(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getHistory(): Promise<ModerationHistoryEntry[]> {
    try {
      const { data } = await apiClient.get<ModerationItemDto[]>('/moderation/history')
      return data.map((dto) => {
        const item = mapModerationItem(dto)
        return {
          id: `hist-${item.id}`,
          moderationItemId: item.id,
          entityType: item.entityType,
          entityId: item.entityId,
          title: item.title,
          companyName: item.companyName,
          decision: {
            id: `dec-${item.id}`,
            moderationItemId: item.id,
            moderatorId: item.assignedModeratorId ?? '',
            moderatorName: item.assignedModeratorName ?? '',
            action:
              item.status === MODERATION_STATUS.APPROVED
                ? MODERATION_ACTION.APPROVED
                : item.status === MODERATION_STATUS.REJECTED
                  ? MODERATION_ACTION.REJECTED
                  : item.status === MODERATION_STATUS.BLOCKED
                    ? MODERATION_ACTION.BLOCKED
                    : MODERATION_ACTION.CHANGES_REQUESTED,
            reasonCode: null,
            comment: item.moderatorNote,
            previousStatus: MODERATION_STATUS.PENDING,
            newStatus: item.status,
            createdAt: item.updatedAt,
            fieldsRequested: [],
            privateNote: item.moderatorNote,
          },
        }
      })
    } catch (e) {
      throw toApiError(e)
    }
  },
}

export const reportsReal = {
  async create(input: {
    targetType: string
    targetId: string
    targetName?: string
    type?: string
    description?: string
    priority?: string
  }): Promise<Report> {
    try {
      const { data } = await apiClient.post<ReportDto>('/reports', {
        target_type: input.targetType,
        target_id: input.targetId,
        target_name: input.targetName ?? '',
        type: input.type ?? 'OTHER',
        description: input.description ?? '',
        priority: input.priority ?? 'NORMAL',
      })
      return mapReport(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getAll(filters?: { status?: string; query?: string; type?: string }): Promise<Report[]> {
    try {
      const { data } = await apiClient.get<ReportDto[]>('/reports', {
        params: { status: filters?.status },
      })
      let items = data.map(mapReport)
      if (filters?.type && filters.type !== 'all') {
        items = items.filter((r) => r.type === filters.type)
      }
      if (filters?.query) {
        const q = filters.query.toLowerCase()
        items = items.filter((r) =>
          `${r.targetName} ${r.reporterName} ${r.description}`.toLowerCase().includes(q),
        )
      }
      return items
    } catch (e) {
      throw toApiError(e)
    }
  },

  async list(filters?: { status?: string; query?: string; type?: string }): Promise<Report[]> {
    return this.getAll(filters)
  },

  async getById(id: string): Promise<Report> {
    try {
      const { data } = await apiClient.get<ReportDto>(`/reports/${id}`)
      return mapReport(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async assignToMe(id: string): Promise<Report> {
    try {
      const { data } = await apiClient.post<ReportDto>(`/reports/${id}/assign`)
      return mapReport(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async resolve(
    id: string,
    input: { resolutionCode: string; comment?: string; applyAction?: string },
  ): Promise<Report> {
    try {
      const { data } = await apiClient.post<ReportDto>(`/reports/${id}/resolve`, {
        resolution_code: input.resolutionCode,
        comment: input.comment,
        apply_action: input.applyAction ?? 'none',
      })
      return mapReport(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async escalate(id: string, comment?: string): Promise<Report> {
    try {
      await apiClient.post(`/reports/${id}/escalate`, null, { params: { comment } })
      return this.getById(id)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async close(id: string): Promise<Report> {
    return this.resolve(id, { resolutionCode: 'NO_VIOLATION', comment: 'Закрыто без нарушения' })
  },

  async applyAction(id: string, note?: string): Promise<Report> {
    return this.resolve(id, {
      resolutionCode: 'ACTION_TAKEN',
      comment: note,
      applyAction: 'request_changes',
    })
  },
}

export const escalationsReal = {
  async getAll(): Promise<Escalation[]> {
    try {
      const { data } = await apiClient.get<EscalationDto[]>('/escalations')
      return data.map((d) => mapEscalation(d))
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getById(id: string): Promise<Escalation> {
    try {
      const { data } = await apiClient.get<EscalationDto>(`/escalations/${id}`)
      return mapEscalation(data)
    } catch (e) {
      throw toApiError(e)
    }
  },
}

/* ── platform admin ───────────────────────────────────────────────── */

function filterAdminUsers(users: AdminUser[], filters?: AdminUserFilters): AdminUser[] {
  if (!filters) return users
  return users.filter((u) => {
    if (filters.role && filters.role !== 'all' && u.systemRole !== filters.role) return false
    if (filters.status && filters.status !== 'all' && u.status !== filters.status) return false
    if (filters.companyId && u.companyId !== filters.companyId) return false
    if (filters.query) {
      const q = filters.query.toLowerCase()
      if (
        !`${u.firstName} ${u.lastName} ${u.email} ${u.companyName ?? ''}`.toLowerCase().includes(q)
      ) {
        return false
      }
    }
    return true
  })
}

export const adminUsersReal = {
  async getAll(filters?: AdminUserFilters): Promise<AdminUser[]> {
    return this.list(filters)
  },

  async list(filters?: AdminUserFilters): Promise<AdminUser[]> {
    try {
      const { data } = await apiClient.get<AdminUserDto[]>('/admin/users', {
        params: {
          q: filters?.query,
          role: filters?.role !== 'all' ? filters?.role : undefined,
          status: filters?.status !== 'all' ? filters?.status : undefined,
        },
      })
      return filterAdminUsers(data.map(mapAdminUser), filters)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getById(id: string): Promise<AdminUser> {
    try {
      const { data } = await apiClient.get<AdminUserDto>(`/admin/users/${id}`)
      return mapAdminUser(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async block(
    id: string,
    input: { reason: string; actor: AdminActor; currentUserId?: string },
  ): Promise<AdminUser> {
    try {
      const { data } = await apiClient.post<AdminUserDto>(`/admin/users/${id}/block`, null, {
        params: { reason: input.reason },
      })
      return mapAdminUser(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async unblock(id: string, _input: { reason?: string; actor: AdminActor }): Promise<AdminUser> {
    try {
      const { data } = await apiClient.post<AdminUserDto>(`/admin/users/${id}/unblock`)
      return mapAdminUser(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async suspend(
    id: string,
    _input: { reason: string; actor: AdminActor; currentUserId?: string },
  ): Promise<AdminUser> {
    try {
      const { data } = await apiClient.post<AdminUserDto>(`/admin/users/${id}/suspend`)
      return mapAdminUser(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async activate(id: string, _input: { reason?: string; actor: AdminActor }): Promise<AdminUser> {
    try {
      const { data } = await apiClient.post<AdminUserDto>(`/admin/users/${id}/activate`)
      return mapAdminUser(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async changeRole(
    id: string,
    input: { newRole: SystemRole; reason: string; actor: AdminActor; currentUserId?: string },
  ): Promise<AdminUser> {
    try {
      const { data } = await apiClient.patch<AdminUserDto>(`/admin/users/${id}/role`, {
        new_role: input.newRole,
        reason: input.reason,
      })
      return mapAdminUser(data)
    } catch (e) {
      throw toApiError(e)
    }
  },
}

function filterCompanies(items: AdminCompany[], filters?: AdminCompanyFilters): AdminCompany[] {
  if (!filters) return items
  return items.filter((c) => {
    if (filters.query) {
      const q = filters.query.toLowerCase()
      if (!`${c.name} ${c.inn} ${c.id}`.toLowerCase().includes(q)) return false
    }
    if (filters.status && filters.status !== 'all' && c.platformStatus !== filters.status) {
      return false
    }
    if (
      filters.verification &&
      filters.verification !== 'all' &&
      c.verificationStatus !== filters.verification
    ) {
      return false
    }
    if (filters.region && c.region !== filters.region) return false
    if (filters.industry && !c.industries.includes(filters.industry)) return false
    return true
  })
}

export const adminCompaniesReal = {
  async getAll(filters?: AdminCompanyFilters): Promise<AdminCompany[]> {
    return this.list(filters)
  },

  async list(filters?: AdminCompanyFilters): Promise<AdminCompany[]> {
    try {
      const { data } = await apiClient.get<AdminCompanyDto[]>('/admin/companies')
      return filterCompanies(data.map(mapAdminCompany), filters)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getById(id: string): Promise<AdminCompany> {
    try {
      const { data } = await apiClient.get<AdminCompanyDto>(`/admin/companies/${id}`)
      return mapAdminCompany(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async changeStatus(
    id: string,
    status: PlatformCompanyStatus,
    reason: string,
    _actor?: AdminActor,
  ): Promise<AdminCompany> {
    try {
      const { data } = await apiClient.patch<AdminCompanyDto>(`/admin/companies/${id}/status`, {
        platform_status: status,
        reason,
      })
      return mapAdminCompany(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async updateStatus(id: string, status: PlatformCompanyStatus): Promise<AdminCompany> {
    return this.changeStatus(id, status, 'Administrative decision')
  },

  async changeVerification(
    id: string,
    verificationStatus: VerificationStatus,
    _reason: string,
    _actor?: AdminActor,
  ): Promise<AdminCompany> {
    try {
      const { data } = await apiClient.post<AdminCompanyDto>(
        `/admin/companies/${id}/verification`,
        { verified: verificationStatus === 'VERIFIED' },
      )
      return mapAdminCompany(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async sendToModeration(id: string, actor?: AdminActor): Promise<AdminCompany> {
    return this.changeVerification(id, 'PENDING', 'Отправлено на повторную проверку', actor)
  },

  async archive(id: string, reason: string, actor?: AdminActor): Promise<AdminCompany> {
    return this.changeStatus(id, 'ARCHIVED', reason, actor)
  },

  async block(id: string, reason = 'Administrative decision', actor?: AdminActor): Promise<AdminCompany> {
    return this.changeStatus(id, 'BLOCKED', reason, actor)
  },

  async unblock(
    id: string,
    reason = 'Administrative decision',
    actor?: AdminActor,
  ): Promise<AdminCompany> {
    return this.changeStatus(id, 'ACTIVE', reason, actor)
  },
}

export const dictionariesReal = {
  async getAll(type?: DictionaryType): Promise<DictionaryItem[]> {
    return this.list(type)
  },

  async list(type?: DictionaryType): Promise<DictionaryItem[]> {
    try {
      const { data } = await apiClient.get<DictionaryDto[]>('/admin/dictionaries', {
        params: { type },
      })
      return data.map(mapDictionary).sort((a, b) => a.sortOrder - b.sortOrder)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getById(id: string): Promise<DictionaryItem> {
    const all = await this.list()
    const item = all.find((d) => d.id === id)
    if (!item) throw toApiError(new Error('Элемент справочника не найден'))
    return item
  },

  async create(input: DictionaryCreateInput, _actor?: AdminActor): Promise<DictionaryItem> {
    try {
      const { data } = await apiClient.post<DictionaryDto>('/admin/dictionaries', {
        type: input.type,
        name: input.name,
        slug: input.slug,
        parent_id: input.parentId != null ? Number(input.parentId) : null,
        aliases: input.aliases,
        status: input.status,
        sort_order: input.sortOrder,
        category: input.category,
        description: input.description,
      })
      return mapDictionary(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async update(
    id: string,
    patch: DictionaryUpdateInput,
    _actor?: AdminActor,
  ): Promise<DictionaryItem> {
    try {
      const current = await this.getById(id)
      const { data } = await apiClient.patch<DictionaryDto>(`/admin/dictionaries/${id}`, {
        type: current.type,
        name: patch.name ?? current.name,
        slug: patch.slug ?? current.slug,
        parent_id:
          patch.parentId !== undefined
            ? patch.parentId != null
              ? Number(patch.parentId)
              : null
            : current.parentId != null
              ? Number(current.parentId)
              : null,
        aliases: patch.aliases ?? current.aliases,
        status: patch.status ?? current.status,
        sort_order: patch.sortOrder ?? current.sortOrder,
        category: patch.category ?? current.category,
        description: patch.description ?? current.description,
      })
      return mapDictionary(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async edit(id: string, name: string): Promise<DictionaryItem> {
    return this.update(id, { name })
  },

  async archive(id: string, actor?: AdminActor): Promise<DictionaryItem> {
    return this.update(id, { status: 'archived' }, actor)
  },

  async restore(id: string, actor?: AdminActor): Promise<DictionaryItem> {
    return this.update(id, { status: 'active' }, actor)
  },
}

export const analyticsReal = {
  async getOverview(period: AnalyticsPeriod = '30d'): Promise<AnalyticsOverview> {
    try {
      const { data } = await apiClient.get<AnalyticsDto>('/admin/analytics/overview')
      return mapAnalytics(data, period)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getFunnel(period: AnalyticsPeriod = '30d') {
    return (await this.getOverview(period)).funnel.map((s) => ({ ...s }))
  },

  async getGrowth(period: AnalyticsPeriod = '30d') {
    return structuredClone((await this.getOverview(period)).growth)
  },

  async getModerationStats(period: AnalyticsPeriod = '30d') {
    return structuredClone((await this.getOverview(period)).moderation)
  },

  async getMetricsTable() {
    const o = await this.getOverview()
    return [
      { label: 'Users', value: o.usersTotal },
      { label: 'Companies', value: o.companiesTotal },
      { label: 'Open opportunities', value: o.opportunitiesOpen },
      { label: 'Active deals', value: o.dealsActive },
      { label: 'Matches', value: o.matchesThisMonth },
      { label: 'Pending moderation', value: o.moderationPending },
      { label: 'Open reports', value: o.openReports },
    ]
  },
}

export const auditReal = {
  async getAll(filters?: AuditFilters): Promise<AuditEvent[]> {
    return this.list(filters)
  },

  async list(filters?: AuditFilters): Promise<AuditEvent[]> {
    try {
      const { data } = await apiClient.get<AuditDto[]>('/admin/audit')
      let items = data.map(mapAudit)
      if (filters?.actorId) items = items.filter((e) => e.actorId === filters.actorId)
      if (filters?.actor) {
        const q = filters.actor.toLowerCase()
        items = items.filter((e) => e.actorName.toLowerCase().includes(q))
      }
      if (filters?.role) {
        items = items.filter((e) => e.actorRole === filters.role || e.role === filters.role)
      }
      if (filters?.action) {
        items = items.filter((e) => e.action.toLowerCase().includes(filters.action!.toLowerCase()))
      }
      if (filters?.targetType || filters?.entityType) {
        const t = filters.targetType ?? filters.entityType
        items = items.filter((e) => e.targetType === t || e.entityType === t)
      }
      if (filters?.query) {
        const q = filters.query.toLowerCase()
        items = items.filter((e) =>
          `${e.actorName} ${e.action} ${e.entityName} ${e.reason ?? ''}`.toLowerCase().includes(q),
        )
      }
      return items.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getById(id: string): Promise<AuditEvent> {
    const all = await this.list()
    const event = all.find((e) => e.id === id)
    if (!event) throw toApiError(new Error('Событие не найдено'))
    return event
  },
}

export const featureFlagsReal = {
  async getAll(): Promise<FeatureFlag[]> {
    try {
      const { data } = await apiClient.get<FeatureFlagDto[]>('/admin/feature-flags')
      return data.map(mapFlag)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getById(id: string): Promise<FeatureFlag> {
    const all = await this.getAll()
    const flag = all.find((f) => f.id === id || f.key === id)
    if (!flag) throw toApiError(new Error('Feature flag не найден'))
    return flag
  },

  async toggle(
    keyOrId: string,
    enabled: boolean,
    _reason: string,
    _actor?: AdminActor,
  ): Promise<FeatureFlag> {
    try {
      const flag = await this.getById(keyOrId)
      const { data } = await apiClient.patch<FeatureFlagDto>(`/admin/feature-flags/${flag.id}`, null, {
        params: { enabled },
      })
      return mapFlag(data)
    } catch (e) {
      throw toApiError(e)
    }
  },
}

export const platformSettingsReal = {
  async get(): Promise<PlatformSettings> {
    try {
      const { data } = await apiClient.get<PlatformSettingsDto>('/admin/settings')
      return mergeSettings(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async getHealth() {
    const settings = await this.get()
    return {
      miniApp: 'Работает' as const,
      mockApi: 'Выключен' as const,
      notifications: 'Работают' as const,
      matching: 'Работает' as const,
      maintenance: settings.maintenance.enabled ? ('Включён' as const) : ('Выключен' as const),
      label: 'Live API' as const,
    }
  },

  async update(patch: Partial<PlatformSettings>, _actor?: AdminActor): Promise<PlatformSettings> {
    try {
      const { data } = await apiClient.patch<PlatformSettingsDto>('/admin/settings', patch)
      return mergeSettings(data)
    } catch (e) {
      throw toApiError(e)
    }
  },

  async updateGeneral(
    general: PlatformSettings['general'],
    actor?: AdminActor,
  ): Promise<PlatformSettings> {
    return this.update({ general }, actor)
  },

  async updateModeration(
    moderation: PlatformSettings['moderation'],
    actor?: AdminActor,
  ): Promise<PlatformSettings> {
    return this.update({ moderation }, actor)
  },

  async updateMatching(
    matching: PlatformSettings['matching'],
    actor?: AdminActor,
  ): Promise<PlatformSettings> {
    return this.update({ matching }, actor)
  },

  async updateNotifications(
    notifications: PlatformSettings['notifications'],
    actor?: AdminActor,
  ): Promise<PlatformSettings> {
    return this.update({ notifications }, actor)
  },

  async setMaintenanceMode(
    enabled: boolean,
    _reason: string,
    message?: string,
    actor?: AdminActor,
  ): Promise<PlatformSettings> {
    const current = await this.get()
    return this.update(
      {
        maintenance: {
          enabled,
          message: message ?? current.maintenance.message,
        },
      },
      actor,
    )
  },
}

export function createApiProxy<T extends object>(
  real: object,
  mock: T,
  useReal: () => boolean,
): T {
  return new Proxy(mock, {
    get(target, prop, receiver) {
      if (
        useReal() &&
        prop in real &&
        typeof (real as Record<string | symbol, unknown>)[prop] === 'function'
      ) {
        const fn = (real as Record<string | symbol, unknown>)[prop] as (...a: unknown[]) => unknown
        return fn.bind(real)
      }
      const value = Reflect.get(target, prop, receiver)
      if (typeof value === 'function') return value.bind(target)
      return value
    },
  }) as T
}
