import { SYSTEM_ROLES, type SystemRole } from '@/entities/user'
import { saveMockState } from '@/shared/lib/mockPersist'

export const AUDIT_ACTIONS = {
  USER_BLOCKED: 'USER_BLOCKED',
  USER_UNBLOCKED: 'USER_UNBLOCKED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  COMPANY_BLOCKED: 'COMPANY_BLOCKED',
  COMPANY_STATUS_CHANGED: 'COMPANY_STATUS_CHANGED',
  COMPANY_VERIFICATION_CHANGED: 'COMPANY_VERIFICATION_CHANGED',
  MODERATION_OVERRIDDEN: 'MODERATION_OVERRIDDEN',
  DICTIONARY_CREATED: 'DICTIONARY_CREATED',
  DICTIONARY_UPDATED: 'DICTIONARY_UPDATED',
  DICTIONARY_ARCHIVED: 'DICTIONARY_ARCHIVED',
  PLATFORM_SETTING_CHANGED: 'PLATFORM_SETTING_CHANGED',
  FEATURE_FLAG_CHANGED: 'FEATURE_FLAG_CHANGED',
  MAINTENANCE_MODE_CHANGED: 'MAINTENANCE_MODE_CHANGED',
  ESCALATION_RESOLVED: 'ESCALATION_RESOLVED',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | string

export interface AuditEvent {
  id: string
  actorId: string
  actorName: string
  actorRole: SystemRole
  /** @deprecated alias of actorRole */
  role: SystemRole
  action: AuditAction
  entityType: string
  entityId: string
  entityName: string
  /** @deprecated alias of entityName */
  entityLabel: string
  previousValue?: unknown
  newValue?: unknown
  before?: unknown
  after?: unknown
  reason?: string
  timestamp: string
  createdAt: string
  ip?: string
  source?: string
  targetType?: string
  targetName?: string
  details?: string
}

export interface AuditFilters {
  actorId?: string
  actor?: string
  role?: SystemRole | string
  action?: string
  entityType?: string
  targetType?: string
  query?: string
  from?: string
  to?: string
  dateFrom?: string
  dateTo?: string
}

function evt(
  partial: Omit<AuditEvent, 'createdAt' | 'entityLabel' | 'role' | 'entityName' | 'actorRole'> & {
    actorRole?: SystemRole
    role?: SystemRole
    entityName?: string
    entityLabel?: string
    createdAt?: string
  },
): AuditEvent {
  const actorRole = partial.actorRole ?? partial.role ?? SYSTEM_ROLES.PLATFORM_ADMIN
  const entityName = partial.entityName ?? partial.entityLabel ?? partial.entityId
  const timestamp = partial.timestamp
  return {
    ...partial,
    actorRole,
    role: actorRole,
    entityName,
    entityLabel: entityName,
    timestamp,
    createdAt: partial.createdAt ?? timestamp,
    targetType: partial.targetType ?? partial.entityType,
    targetName: partial.targetName ?? entityName,
  }
}

export const mockAuditEvents: AuditEvent[] = [
  evt({
    id: 'audit-1',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.USER_BLOCKED,
    entityType: 'user',
    entityId: 'user-sergey',
    entityLabel: 'Сергей Морозов',
    timestamp: '2026-09-24T12:42:00.000Z',
    reason: 'Terms violation',
    before: { status: 'active' },
    after: { status: 'blocked' },
    source: 'platform_admin',
  }),
  evt({
    id: 'audit-2',
    actorId: 'user-moderator',
    actorName: 'Елена Морозова',
    role: SYSTEM_ROLES.MODERATOR,
    action: 'approve_moderation',
    entityType: 'company',
    entityId: 'company-techflow',
    entityLabel: 'ООО «TechFlow»',
    timestamp: '2026-09-24T12:35:00.000Z',
    source: 'moderation',
  }),
  evt({
    id: 'audit-3',
    actorId: 'system',
    actorName: 'Система',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.DICTIONARY_ARCHIVED,
    entityType: 'dictionary',
    entityId: 'doc-expired',
    entityLabel: 'Просроченный документ',
    timestamp: '2026-09-24T11:20:00.000Z',
    source: 'system',
    details: 'Автоархивация просроченного документа',
  }),
  evt({
    id: 'audit-4',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.COMPANY_VERIFICATION_CHANGED,
    entityType: 'company',
    entityId: 'company-digital-lab',
    entityLabel: 'ООО «Digital Lab»',
    timestamp: '2026-09-23T16:40:00.000Z',
    reason: 'Документы подтверждены',
    before: { verificationStatus: 'PENDING' },
    after: { verificationStatus: 'VERIFIED' },
  }),
  evt({
    id: 'audit-5',
    actorId: 'user-admin',
    actorName: 'Ирина Соколова',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.FEATURE_FLAG_CHANGED,
    entityType: 'feature_flag',
    entityId: 'flag-deal-room',
    entityLabel: 'deal_room',
    timestamp: '2026-09-23T14:00:00.000Z',
    reason: 'Пилот для TEST scope',
    before: { enabled: false },
    after: { enabled: true },
  }),
  evt({
    id: 'audit-6',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.PLATFORM_SETTING_CHANGED,
    entityType: 'settings',
    entityId: 'platform',
    entityLabel: 'matching.minScoreToShow',
    timestamp: '2026-09-23T10:00:00.000Z',
    reason: 'Повышение качества матчей',
    before: { 'matching.minScore': 70 },
    after: { 'matching.minScore': 75 },
  }),
  evt({
    id: 'audit-7',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.DICTIONARY_CREATED,
    entityType: 'dictionary',
    entityId: 'cat-iot',
    entityLabel: 'IoT-решения',
    timestamp: '2026-09-22T09:30:00.000Z',
  }),
  evt({
    id: 'audit-8',
    actorId: 'user-moderator',
    actorName: 'Елена Морозова',
    role: SYSTEM_ROLES.MODERATOR,
    action: 'reject_moderation',
    entityType: 'company',
    entityId: 'company-brandpulse',
    entityLabel: 'ООО «BrandPulse»',
    timestamp: '2026-09-21T15:20:00.000Z',
    reason: 'Расхождение ОГРН',
  }),
  evt({
    id: 'audit-9',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.COMPANY_BLOCKED,
    entityType: 'company',
    entityId: 'company-brandpulse',
    entityLabel: 'ООО «BrandPulse»',
    timestamp: '2026-09-21T15:40:00.000Z',
    reason: 'Fraud / abuse',
  }),
  evt({
    id: 'audit-10',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
    entityType: 'user',
    entityId: 'user-moderator',
    entityLabel: 'Елена Морозова',
    timestamp: '2026-09-20T11:00:00.000Z',
    reason: 'Назначение модератором',
    before: { role: 'BUSINESS_USER' },
    after: { role: 'MODERATOR' },
  }),
  evt({
    id: 'audit-11',
    actorId: 'user-admin',
    actorName: 'Ирина Соколова',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.DICTIONARY_UPDATED,
    entityType: 'dictionary',
    entityId: 'ind-healthcare',
    entityLabel: 'Healthcare',
    timestamp: '2026-09-19T13:00:00.000Z',
  }),
  evt({
    id: 'audit-12',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.USER_UNBLOCKED,
    entityType: 'user',
    entityId: 'user-olga',
    entityLabel: 'Ольга Белова',
    timestamp: '2026-09-18T09:20:00.000Z',
    reason: 'Ложная сработка',
  }),
  evt({
    id: 'audit-13',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.MAINTENANCE_MODE_CHANGED,
    entityType: 'settings',
    entityId: 'platform',
    entityLabel: 'Maintenance mode',
    timestamp: '2026-09-17T07:00:00.000Z',
    reason: 'Плановые работы',
    before: { enabled: false },
    after: { enabled: true },
  }),
  evt({
    id: 'audit-14',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.MAINTENANCE_MODE_CHANGED,
    entityType: 'settings',
    entityId: 'platform',
    entityLabel: 'Maintenance mode',
    timestamp: '2026-09-17T09:00:00.000Z',
    reason: 'Работы завершены',
    before: { enabled: true },
    after: { enabled: false },
  }),
  evt({
    id: 'audit-15',
    actorId: 'user-moderator',
    actorName: 'Елена Морозова',
    role: SYSTEM_ROLES.MODERATOR,
    action: 'close_report',
    entityType: 'report',
    entityId: 'report-5',
    entityLabel: 'Spam report',
    timestamp: '2026-09-16T11:45:00.000Z',
  }),
  evt({
    id: 'audit-16',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.ESCALATION_RESOLVED,
    entityType: 'escalation',
    entityId: 'esc-1',
    entityLabel: 'Эскалация BrandPulse',
    timestamp: '2026-09-15T16:25:00.000Z',
    reason: 'Подтверждена блокировка',
  }),
  evt({
    id: 'audit-17',
    actorId: 'user-admin',
    actorName: 'Ирина Соколова',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.COMPANY_STATUS_CHANGED,
    entityType: 'company',
    entityId: 'company-fastequip',
    entityLabel: 'ООО «FastEquip»',
    timestamp: '2026-09-14T12:10:00.000Z',
    reason: 'Временная приостановка',
    before: { status: 'ACTIVE' },
    after: { status: 'SUSPENDED' },
  }),
  evt({
    id: 'audit-18',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.DICTIONARY_ARCHIVED,
    entityType: 'dictionary',
    entityId: 'tech-jquery',
    entityLabel: 'jQuery',
    timestamp: '2026-09-13T13:00:00.000Z',
  }),
  evt({
    id: 'audit-19',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.USER_SUSPENDED,
    entityType: 'user',
    entityId: 'user-alexey',
    entityLabel: 'Алексей Григорьев',
    timestamp: '2026-09-12T10:00:00.000Z',
    reason: 'Security issue',
  }),
  evt({
    id: 'audit-20',
    actorId: 'user-moderator',
    actorName: 'Елена Морозова',
    role: SYSTEM_ROLES.MODERATOR,
    action: 'request_changes',
    entityType: 'case',
    entityId: 'case-x',
    entityLabel: 'Кейс внедрения WMS',
    timestamp: '2026-09-11T16:25:00.000Z',
  }),
  evt({
    id: 'audit-21',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.MODERATION_OVERRIDDEN,
    entityType: 'moderation',
    entityId: 'mod-12',
    entityLabel: 'Модерация кейса',
    timestamp: '2026-09-10T14:15:00.000Z',
    reason: 'Ошибочное отклонение',
    before: { decision: 'REJECTED' },
    after: { decision: 'APPROVED' },
  }),
  evt({
    id: 'audit-22',
    actorId: 'user-admin',
    actorName: 'Ирина Соколова',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.FEATURE_FLAG_CHANGED,
    entityType: 'feature_flag',
    entityId: 'flag-matching-v2',
    entityLabel: 'matching_v2',
    timestamp: '2026-09-09T09:00:00.000Z',
    reason: 'Включение на TEST',
    before: { enabled: false },
    after: { enabled: true },
  }),
  evt({
    id: 'audit-23',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.COMPANY_STATUS_CHANGED,
    entityType: 'company',
    entityId: 'company-logistics-one',
    entityLabel: 'ООО «Logistics One»',
    timestamp: '2026-09-08T08:40:00.000Z',
    reason: 'Восстановление после проверки',
    before: { status: 'SUSPENDED' },
    after: { status: 'ACTIVE' },
  }),
  evt({
    id: 'audit-24',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.DICTIONARY_CREATED,
    entityType: 'dictionary',
    entityId: 'sk-nextjs',
    entityLabel: 'Next.js',
    timestamp: '2026-09-07T11:20:00.000Z',
  }),
  evt({
    id: 'audit-25',
    actorId: 'user-platform-admin',
    actorName: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.PLATFORM_SETTING_CHANGED,
    entityType: 'settings',
    entityId: 'platform',
    entityLabel: 'moderation.autoQueueNewCompanies',
    timestamp: '2026-09-06T10:00:00.000Z',
    reason: 'Усиление модерации',
    before: { autoQueueNewCompanies: false },
    after: { autoQueueNewCompanies: true },
  }),
  evt({
    id: 'audit-26',
    actorId: 'user-admin',
    actorName: 'Ирина Соколова',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
    action: AUDIT_ACTIONS.USER_ACTIVATED,
    entityType: 'user',
    entityId: 'user-viktoria',
    entityLabel: 'Виктория Лебедева',
    timestamp: '2026-09-05T12:00:00.000Z',
    reason: 'Окончание проверки',
  }),
]

function persistAudit() {
  saveMockState('auditEvents', mockAuditEvents)
}

export function appendAudit(
  input: Omit<AuditEvent, 'id' | 'timestamp' | 'createdAt' | 'entityLabel' | 'role' | 'actorRole' | 'entityName'> & {
    timestamp?: string
    actorRole?: SystemRole
    role?: SystemRole
    entityName?: string
    entityLabel?: string
  },
): AuditEvent {
  const timestamp = input.timestamp ?? new Date().toISOString()
  const actorRole = input.actorRole ?? input.role ?? SYSTEM_ROLES.PLATFORM_ADMIN
  const entityName = input.entityName ?? input.entityLabel ?? input.entityId
  const event: AuditEvent = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actorId: input.actorId,
    actorName: input.actorName,
    actorRole,
    role: actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    entityName,
    entityLabel: entityName,
    previousValue: input.previousValue,
    newValue: input.newValue,
    before: input.before,
    after: input.after,
    reason: input.reason,
    timestamp,
    createdAt: timestamp,
    ip: input.ip,
    source: input.source ?? 'platform_admin',
    targetType: input.targetType ?? input.entityType,
    targetName: input.targetName ?? entityName,
    details: input.details,
  }
  mockAuditEvents.unshift(event)
  persistAudit()
  return event
}

export function getAuditEventById(id: string): AuditEvent | undefined {
  return mockAuditEvents.find((e) => e.id === id)
}
