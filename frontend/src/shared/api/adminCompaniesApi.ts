import { SYSTEM_ROLES, type SystemRole } from '@/entities/user'
import type { Company } from '@/entities/company'
import { delay } from '@/shared/lib/delay'
import { saveMockState } from '@/shared/lib/mockPersist'
import { AUDIT_ACTIONS, appendAudit } from '@/shared/mocks/audit'
import { mockCompanies } from '@/shared/mocks/companies'
import type { AdminActor } from './adminUsersApi'
import { isReal } from '@/shared/api/apiCapabilities'
import { adminCompaniesReal, createApiProxy } from '@/shared/api/real/moderationAdmin'

export type PlatformCompanyStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'ARCHIVED'

export type VerificationStatus =
  | 'NOT_VERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'REQUIRES_UPDATE'

export interface AdminCompanyEmployee {
  id: string
  name: string
  role: string
  email: string
}

export interface AdminCompanyService {
  id: string
  name: string
  description: string
}

export interface AdminCompanyCase {
  id: string
  title: string
  client: string
  year: number
}

export interface AdminCompanyDocument {
  id: string
  name: string
  type: string
  status: string
}

export interface AdminCompanyReportRef {
  id: string
  reason: string
  status: 'OPEN' | 'RESOLVED' | 'ESCALATED' | string
  createdAt: string
}

export interface AdminCompanyHistoryEntry {
  id: string
  date: string
  title: string
  description: string
}

export interface AdminCompany {
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
  /** read-only business data */
  employees: AdminCompanyEmployee[]
  servicesList: AdminCompanyService[]
  cases: AdminCompanyCase[]
  documents: AdminCompanyDocument[]
  reports: AdminCompanyReportRef[]
  history: AdminCompanyHistoryEntry[]
  verificationSource: 'Model data' | 'Test data'
}

export interface AdminCompanyFilters {
  query?: string
  status?: PlatformCompanyStatus | 'all'
  verification?: VerificationStatus | 'all'
  region?: string
  industry?: string
  sort?: 'name' | 'created' | 'reports' | 'status'
}

interface AdminCompanyState {
  platformStatus: PlatformCompanyStatus
  verificationStatus: VerificationStatus
  createdAt: string
  updatedAt: string
}

const companyState = new Map<string, AdminCompanyState>()

function persistCompanyState() {
  const entries = Object.fromEntries(companyState.entries())
  saveMockState('adminCompanyState', entries)
}

export function hydrateAdminCompanyState() {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem('b2b_match_mock_v1_adminCompanyState')
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, AdminCompanyState>
    Object.entries(parsed).forEach(([id, state]) => companyState.set(id, state))
  } catch {
    /* ignore */
  }
}

function mapLegacyVerification(company: Company): VerificationStatus {
  if (company.verificationStatus === 'verified' || company.verified) return 'VERIFIED'
  if (company.verificationStatus === 'pending') return 'PENDING'
  if (company.verificationStatus === 'rejected') return 'REJECTED'
  return 'NOT_VERIFIED'
}

function initState(company: Company): AdminCompanyState {
  const existing = companyState.get(company.id)
  if (existing) return existing
  const state: AdminCompanyState = {
    platformStatus:
      company.status === 'blocked'
        ? 'BLOCKED'
        : company.id === 'company-brandpulse'
          ? 'BLOCKED'
          : 'ACTIVE',
    verificationStatus: mapLegacyVerification(company),
    createdAt: '2025-06-01T10:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
  }
  if (company.id === 'company-medsupply' || company.id === 'company-retailsoft') {
    state.verificationStatus = 'PENDING'
  }
  if (company.id === 'company-fastequip') {
    state.platformStatus = 'SUSPENDED'
    state.verificationStatus = 'REQUIRES_UPDATE'
  }
  companyState.set(company.id, state)
  return state
}

function enrich(company: Company): AdminCompany {
  const state = initState(company)
  const reports: AdminCompanyReportRef[] =
    company.id === 'company-medsupply' || company.id === 'company-brandpulse'
      ? [
          {
            id: `rep-${company.id}`,
            reason: company.id === 'company-brandpulse' ? 'Fraud' : 'Fake company',
            status: company.id === 'company-brandpulse' ? 'ESCALATED' : 'OPEN',
            createdAt: '2026-09-22T09:30:00.000Z',
          },
        ]
      : []
  const membersCount = 3 + (company.casesCount % 8)
  return {
    id: company.id,
    name: company.name,
    legalName: company.name,
    shortName: company.shortName,
    inn: company.inn,
    ogrn: company.ogrn,
    logoUrl: company.logoUrl,
    description: company.description,
    website: company.website,
    region: company.region,
    industries: company.industries,
    services: company.services,
    technologies: company.technologies,
    status: state.platformStatus,
    platformStatus: state.platformStatus,
    verificationStatus: state.verificationStatus,
    membersCount,
    employeesCount: membersCount,
    reportsCount: reports.length,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    verified: state.verificationStatus === 'VERIFIED',
    casesCount: company.casesCount,
    verificationSource: 'Model data',
    employees: [
      {
        id: `${company.id}-emp-1`,
        name: 'Руководитель аккаунта',
        role: 'Администратор компании',
        email: `admin@${company.shortName.toLowerCase().replace(/\s+/g, '')}.example`,
      },
      {
        id: `${company.id}-emp-2`,
        name: 'Менеджер продаж',
        role: 'Менеджер',
        email: `sales@${company.shortName.toLowerCase().replace(/\s+/g, '')}.example`,
      },
    ],
    servicesList: company.services.map((name, i) => ({
      id: `${company.id}-svc-${i}`,
      name,
      description: `Услуга «${name}» (read-only)`,
    })),
    cases: Array.from({ length: Math.min(company.casesCount, 3) }, (_, i) => ({
      id: `${company.id}-case-${i}`,
      title: `Кейс ${i + 1}`,
      client: `Клиент ${i + 1}`,
      year: 2024 + (i % 2),
    })),
    documents: [
      {
        id: `${company.id}-doc-1`,
        name: 'Карточка предприятия',
        type: 'Договор',
        status: state.verificationStatus === 'VERIFIED' ? 'approved' : 'pending',
      },
    ],
    reports,
    history: [
      {
        id: `${company.id}-hist-1`,
        date: state.createdAt,
        title: 'Регистрация на платформе',
        description: 'Компания создала профиль',
      },
      {
        id: `${company.id}-hist-2`,
        date: state.updatedAt,
        title: 'Обновление статуса',
        description: `Статус: ${state.platformStatus}, verification: ${state.verificationStatus}`,
      },
    ],
  }
}

function applyFilters(companies: AdminCompany[], filters?: AdminCompanyFilters): AdminCompany[] {
  if (!filters) return companies
  return companies.filter((c) => {
    if (filters.query) {
      const q = filters.query.toLowerCase()
      if (!`${c.name} ${c.legalName} ${c.inn} ${c.ogrn} ${c.id}`.toLowerCase().includes(q)) {
        return false
      }
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

function sortCompanies(list: AdminCompany[], sort?: AdminCompanyFilters['sort']): AdminCompany[] {
  const items = [...list]
  switch (sort) {
    case 'reports':
      return items.sort((a, b) => b.reportsCount - a.reportsCount)
    case 'status':
      return items.sort((a, b) => a.platformStatus.localeCompare(b.platformStatus))
    case 'created':
      return items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    case 'name':
    default:
      return items.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }
}

function defaultActor(): AdminActor {
  return {
    id: 'user-platform-admin',
    name: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
  }
}

const mockAdminCompaniesApi = {
  async getAll(filters?: AdminCompanyFilters): Promise<AdminCompany[]> {
    return this.list(filters)
  },

  async list(filters?: AdminCompanyFilters): Promise<AdminCompany[]> {
    await delay(200 + Math.floor(Math.random() * 400))
    return sortCompanies(applyFilters(mockCompanies.map(enrich), filters), filters?.sort)
  },

  async getById(id: string): Promise<AdminCompany> {
    await delay(200 + Math.floor(Math.random() * 300))
    const company = mockCompanies.find((c) => c.id === id)
    if (!company) throw new Error('Компания не найдена')
    return enrich(company)
  },

  async changeStatus(
    id: string,
    status: PlatformCompanyStatus,
    reason: string,
    actor: AdminActor = defaultActor(),
  ): Promise<AdminCompany> {
    await delay(400 + Math.floor(Math.random() * 500))
    const company = mockCompanies.find((c) => c.id === id)
    if (!company) throw new Error('Компания не найдена')
    const state = initState(company)
    const previous = state.platformStatus
    state.platformStatus = status
    state.updatedAt = new Date().toISOString()
    companyState.set(id, state)
    persistCompanyState()
    appendAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      role: actor.role,
      action:
        status === 'BLOCKED' ? AUDIT_ACTIONS.COMPANY_BLOCKED : AUDIT_ACTIONS.COMPANY_STATUS_CHANGED,
      entityType: 'company',
      entityId: id,
      entityName: company.name,
      entityLabel: company.name,
      previousValue: previous,
      newValue: status,
      before: { status: previous },
      after: { status },
      reason,
      source: 'platform_admin',
    })
    return enrich(company)
  },

  async updateStatus(id: string, status: PlatformCompanyStatus): Promise<AdminCompany> {
    return this.changeStatus(id, status, 'Administrative decision')
  },

  async changeVerification(
    id: string,
    verificationStatus: VerificationStatus,
    reason: string,
    actor: AdminActor = defaultActor(),
  ): Promise<AdminCompany> {
    await delay(400 + Math.floor(Math.random() * 500))
    const company = mockCompanies.find((c) => c.id === id)
    if (!company) throw new Error('Компания не найдена')
    const state = initState(company)
    const previous = state.verificationStatus
    state.verificationStatus = verificationStatus
    state.updatedAt = new Date().toISOString()
    companyState.set(id, state)
    persistCompanyState()
    appendAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      role: actor.role,
      action: AUDIT_ACTIONS.COMPANY_VERIFICATION_CHANGED,
      entityType: 'company',
      entityId: id,
      entityName: company.name,
      entityLabel: company.name,
      previousValue: previous,
      newValue: verificationStatus,
      before: { verificationStatus: previous },
      after: { verificationStatus },
      reason,
      source: 'platform_admin',
    })
    return enrich(company)
  },

  async sendToModeration(id: string, actor: AdminActor = defaultActor()): Promise<AdminCompany> {
    return this.changeVerification(id, 'PENDING', 'Отправлено на повторную проверку', actor)
  },

  async archive(
    id: string,
    reason: string,
    actor: AdminActor = defaultActor(),
  ): Promise<AdminCompany> {
    return this.changeStatus(id, 'ARCHIVED', reason, actor)
  },

  async block(
    id: string,
    reason = 'Administrative decision',
    actor: AdminActor = defaultActor(),
  ): Promise<AdminCompany> {
    return this.changeStatus(id, 'BLOCKED', reason, actor)
  },

  async unblock(
    id: string,
    reason = 'Administrative decision',
    actor: AdminActor = defaultActor(),
  ): Promise<AdminCompany> {
    return this.changeStatus(id, 'ACTIVE', reason, actor)
  },
}

export const adminCompaniesApi = createApiProxy(adminCompaniesReal, mockAdminCompaniesApi, () =>
  isReal('admin'),
)

export type { SystemRole }
