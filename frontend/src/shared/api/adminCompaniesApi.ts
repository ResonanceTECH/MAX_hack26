import type { Company } from '@/entities/company'
import { delay } from '@/shared/lib/delay'
import { mockCompanies } from '@/shared/mocks/companies'

export type PlatformCompanyStatus =
  | 'active'
  | 'pending_moderation'
  | 'blocked'
  | 'suspended'

export type VerificationStatus = 'verified' | 'unverified' | 'pending'

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
  status: string
  createdAt: string
}

export interface AdminCompanyHistoryEntry {
  id: string
  date: string
  title: string
  description: string
}

export interface AdminCompany extends Omit<Company, 'verificationStatus' | 'status'> {
  employeesCount: number
  verificationStatus: VerificationStatus
  platformStatus: PlatformCompanyStatus
  employees: AdminCompanyEmployee[]
  servicesList: AdminCompanyService[]
  cases: AdminCompanyCase[]
  documents: AdminCompanyDocument[]
  reports: AdminCompanyReportRef[]
  history: AdminCompanyHistoryEntry[]
}

export interface AdminCompanyFilters {
  query?: string
  verified?: boolean | 'all'
  status?: PlatformCompanyStatus | 'all'
  region?: string
}

interface AdminCompanyState {
  platformStatus: PlatformCompanyStatus
  verificationStatus: VerificationStatus
}

const companyState = new Map<string, AdminCompanyState>()

function initState(company: Company): AdminCompanyState {
  const existing = companyState.get(company.id)
  if (existing) return existing
  const state: AdminCompanyState = {
    platformStatus: company.verified ? 'active' : 'pending_moderation',
    verificationStatus: company.verified ? 'verified' : 'unverified',
  }
  if (company.id === 'company-brandpulse') {
    state.platformStatus = 'blocked'
    state.verificationStatus = 'unverified'
  }
  if (company.id === 'company-medsupply' || company.id === 'company-retailsoft') {
    state.platformStatus = 'pending_moderation'
    state.verificationStatus = 'pending'
  }
  companyState.set(company.id, state)
  return state
}

function enrich(company: Company): AdminCompany {
  const state = initState(company)
  return {
    ...company,
    employeesCount: 3 + (company.casesCount % 8),
    verificationStatus: state.verificationStatus,
    platformStatus: state.platformStatus,
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
      {
        id: `${company.id}-emp-3`,
        name: 'Наблюдатель',
        role: 'Наблюдатель',
        email: `viewer@${company.shortName.toLowerCase().replace(/\s+/g, '')}.example`,
      },
    ],
    servicesList: company.services.map((name, i) => ({
      id: `${company.id}-svc-${i}`,
      name,
      description: `Услуга «${name}» в портфеле ${company.shortName}`,
    })),
    cases: Array.from({ length: Math.min(company.casesCount, 3) }, (_, i) => ({
      id: `${company.id}-case-${i}`,
      title: `Кейс ${i + 1}: ${company.services[i % company.services.length] ?? 'Проект'}`,
      client: `Клиент ${i + 1}`,
      year: 2024 + (i % 2),
    })),
    documents: [
      {
        id: `${company.id}-doc-1`,
        name: 'Карточка предприятия',
        type: 'Договор',
        status: state.verificationStatus === 'verified' ? 'approved' : 'pending',
      },
      {
        id: `${company.id}-doc-2`,
        name: 'Выписка ЕГРЮЛ',
        type: 'Сертификат',
        status: state.verificationStatus === 'verified' ? 'approved' : 'pending',
      },
    ],
    reports:
      company.id === 'company-medsupply' || company.id === 'company-brandpulse'
        ? [
            {
              id: `rep-${company.id}`,
              reason: company.id === 'company-brandpulse' ? 'Fraud' : 'Fake company',
              status: 'open',
              createdAt: '2026-09-22T09:30:00.000Z',
            },
          ]
        : [],
    history: [
      {
        id: `${company.id}-hist-1`,
        date: '2026-09-01T10:00:00.000Z',
        title: 'Регистрация на платформе',
        description: 'Компания создала профиль',
      },
      {
        id: `${company.id}-hist-2`,
        date: '2026-09-10T12:00:00.000Z',
        title: 'Обновление статуса',
        description: `Текущий статус: ${state.platformStatus}`,
      },
    ],
  }
}

function applyFilters(companies: AdminCompany[], filters?: AdminCompanyFilters): AdminCompany[] {
  if (!filters) return companies
  return companies.filter((c) => {
    if (filters.query) {
      const q = filters.query.toLowerCase()
      if (!`${c.name} ${c.shortName} ${c.inn}`.toLowerCase().includes(q)) return false
    }
    if (filters.verified !== undefined && filters.verified !== 'all') {
      const isVerified = c.verificationStatus === 'verified'
      if (isVerified !== filters.verified) return false
    }
    if (filters.status && filters.status !== 'all' && c.platformStatus !== filters.status) {
      return false
    }
    if (filters.region && c.region !== filters.region) return false
    return true
  })
}

export const adminCompaniesApi = {
  async list(filters?: AdminCompanyFilters): Promise<AdminCompany[]> {
    await delay()
    const enriched = mockCompanies.map(enrich)
    return applyFilters(enriched, filters)
  },

  async getById(id: string): Promise<AdminCompany> {
    await delay()
    const company = mockCompanies.find((c) => c.id === id)
    if (!company) throw new Error('Компания не найдена')
    return enrich(company)
  },

  async updateStatus(id: string, status: PlatformCompanyStatus): Promise<AdminCompany> {
    await delay()
    const company = mockCompanies.find((c) => c.id === id)
    if (!company) throw new Error('Компания не найдена')
    const state = initState(company)
    state.platformStatus = status
    companyState.set(id, state)
    return enrich(company)
  },

  async sendToModeration(id: string): Promise<AdminCompany> {
    return this.updateStatus(id, 'pending_moderation')
  },

  async block(id: string): Promise<AdminCompany> {
    return this.updateStatus(id, 'blocked')
  },
}
