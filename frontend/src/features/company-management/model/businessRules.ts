import type { Company } from '@/entities/company'
import type { CompanyCase } from '@/entities/company-case'
import { COMPANY_CASE_STATUS } from '@/entities/company-case'
import type { CompanyDocument } from '@/entities/company-document'
import { COMPANY_DOCUMENT_STATUS } from '@/entities/company-document'
import {
  COMPANY_MEMBER_ROLES,
  COMPANY_MEMBER_STATUS,
  type CompanyMember,
  type CompanyMemberRole,
} from '@/entities/company-member'
import type { CompanyService } from '@/entities/company-service'
import { COMPANY_SERVICE_STATUS } from '@/entities/company-service'

const LAST_ADMIN_MESSAGE = 'В компании должен оставаться минимум один администратор.'

export const VERIFIED_LOCKED_FIELDS = ['inn', 'ogrn', 'name'] as const
export type VerifiedLockedField = (typeof VERIFIED_LOCKED_FIELDS)[number]

export interface ProfileCompletionResult {
  percent: number
  completed: string[]
  missing: string[]
  recommendations: string[]
}

export interface ProfileCompletionExtras {
  services?: CompanyService[]
  cases?: CompanyCase[]
  documents?: CompanyDocument[]
}

function isEffectiveMember(member: CompanyMember): boolean {
  return (
    member.status !== COMPANY_MEMBER_STATUS.SUSPENDED &&
    member.status !== COMPANY_MEMBER_STATUS.DEACTIVATED
  )
}

export function isEffectiveAdmin(member: CompanyMember): boolean {
  return member.role === COMPANY_MEMBER_ROLES.COMPANY_ADMIN && isEffectiveMember(member)
}

export function countEffectiveAdmins(members: CompanyMember[]): number {
  return members.filter(isEffectiveAdmin).length
}

export function canChangeMemberRole(
  members: CompanyMember[],
  target: CompanyMember,
  nextRole: CompanyMemberRole,
  _currentUserId?: string,
): { allowed: boolean; reason?: string } {
  if (!isEffectiveAdmin(target)) {
    return { allowed: true }
  }
  if (nextRole === COMPANY_MEMBER_ROLES.COMPANY_ADMIN) {
    return { allowed: true }
  }
  if (countEffectiveAdmins(members) <= 1) {
    return { allowed: false, reason: LAST_ADMIN_MESSAGE }
  }
  return { allowed: true }
}

export function canRemoveMember(
  members: CompanyMember[],
  target: CompanyMember,
  _currentUserId?: string,
): { allowed: boolean; reason?: string } {
  if (!isEffectiveAdmin(target)) {
    return { allowed: true }
  }
  if (countEffectiveAdmins(members) <= 1) {
    return { allowed: false, reason: LAST_ADMIN_MESSAGE }
  }
  return { allowed: true }
}

export function canSuspendMember(
  members: CompanyMember[],
  target: CompanyMember,
  _currentUserId?: string,
): { allowed: boolean; reason?: string } {
  return canRemoveMember(members, target, _currentUserId)
}

export function canEditVerifiedField(field: string, company: Company): boolean {
  if (!company.verified) return true
  return !VERIFIED_LOCKED_FIELDS.includes(field as VerifiedLockedField)
}

const WEIGHTS = {
  basics: 15,
  description: 10,
  industries: 10,
  services: 15,
  capabilities: 10,
  cases: 15,
  documents: 10,
  contacts: 5,
  geography: 5,
  commercial: 5,
} as const

export function calculateCompanyProfileCompletion(
  company: Company,
  extras: ProfileCompletionExtras = {},
): ProfileCompletionResult {
  const services = extras.services ?? []
  const cases = extras.cases ?? []
  const documents = extras.documents ?? []

  const activeServices = services.filter((s) => s.status === COMPANY_SERVICE_STATUS.ACTIVE)
  const publishedCases = cases.filter((c) => c.status === COMPANY_CASE_STATUS.PUBLISHED)
  const verifiedDocs = documents.filter((d) => d.status === COMPANY_DOCUMENT_STATUS.VERIFIED)

  const checks: { key: string; label: string; weight: number; ok: boolean; recommendation?: string }[] =
    [
      {
        key: 'basics',
        label: 'Основные данные',
        weight: WEIGHTS.basics,
        ok: Boolean(company.name && company.inn && company.ogrn),
        recommendation: 'Заполните название, ИНН и ОГРН компании',
      },
      {
        key: 'description',
        label: 'Описание',
        weight: WEIGHTS.description,
        ok: Boolean(company.description && company.description.trim().length >= 40),
        recommendation: 'Добавьте развёрнутое описание компании',
      },
      {
        key: 'industries',
        label: 'Отрасли',
        weight: WEIGHTS.industries,
        ok: company.industries.length > 0,
        recommendation: 'Укажите отрасли, в которых работаете',
      },
      {
        key: 'services',
        label: 'Услуги',
        weight: WEIGHTS.services,
        ok: activeServices.length >= 1 || company.services.length >= 1,
        recommendation: 'Опубликуйте хотя бы одну услугу',
      },
      {
        key: 'capabilities',
        label: 'Компетенции',
        weight: WEIGHTS.capabilities,
        ok: company.capabilities.length > 0 || company.technologies.length > 0,
        recommendation: 'Добавьте компетенции и технологии',
      },
      {
        key: 'cases',
        label: 'Кейсы',
        weight: WEIGHTS.cases,
        ok: publishedCases.length >= 2 || company.casesCount >= 2,
        recommendation:
          publishedCases.length === 1
            ? 'Добавьте ещё один кейс, чтобы заказчики лучше понимали ваш опыт'
            : 'Опубликуйте минимум 2 кейса',
      },
      {
        key: 'documents',
        label: 'Документы',
        weight: WEIGHTS.documents,
        ok: verifiedDocs.length >= 1,
        recommendation: 'Загрузите и подтвердите хотя бы один документ',
      },
      {
        key: 'contacts',
        label: 'Контакты',
        weight: WEIGHTS.contacts,
        ok: Boolean(company.website),
        recommendation: 'Укажите сайт компании',
      },
      {
        key: 'geography',
        label: 'География',
        weight: WEIGHTS.geography,
        ok: Boolean(company.region),
        recommendation: 'Укажите регион присутствия',
      },
      {
        key: 'commercial',
        label: 'Коммерческие параметры',
        weight: WEIGHTS.commercial,
        ok: company.priceFrom != null || company.priceTo != null,
        recommendation: 'Укажите минимальную стоимость проекта',
      },
    ]

  let earned = 0
  const completed: string[] = []
  const missing: string[] = []
  const recommendations: string[] = []

  for (const check of checks) {
    if (check.ok) {
      earned += check.weight
      completed.push(check.label)
    } else {
      missing.push(check.label)
      if (check.recommendation) recommendations.push(check.recommendation)
    }
  }

  if (verifiedDocs.length === 0) {
    recommendations.push('Добавьте сертификат или выписку ЕГРЮЛ')
  }

  return {
    percent: Math.min(100, Math.round(earned)),
    completed,
    missing,
    recommendations: [...new Set(recommendations)],
  }
}

export function isServicePublic(service: CompanyService): boolean {
  return service.status === COMPANY_SERVICE_STATUS.ACTIVE
}

export function isCasePublic(item: CompanyCase): boolean {
  return item.status === COMPANY_CASE_STATUS.PUBLISHED
}

export function isDocumentExpired(doc: CompanyDocument, now = new Date()): boolean {
  if (doc.status === COMPANY_DOCUMENT_STATUS.EXPIRED) return true
  if (!doc.expiresAt) return false
  return new Date(doc.expiresAt).getTime() < now.getTime()
}

export { LAST_ADMIN_MESSAGE }
