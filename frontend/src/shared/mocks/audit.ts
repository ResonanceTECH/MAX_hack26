import type { SystemRole } from '@/entities/user'

export interface AuditEvent {
  id: string
  actorId: string
  actorName: string
  role: SystemRole
  action: string
  entityType: string
  entityId: string
  entityLabel: string
  timestamp: string
  /** aliases used by auditApi filters */
  targetType?: string
  targetName?: string
  details?: string
}

export interface AuditFilters {
  actorId?: string
  actor?: string
  action?: string
  entityType?: string
  targetType?: string
  query?: string
  from?: string
  to?: string
  dateFrom?: string
  dateTo?: string
}

export const mockAuditEvents: AuditEvent[] = [
  {
    id: 'audit-1',
    actorId: 'user-admin',
    actorName: 'Алексей Админов',
    role: 'PLATFORM_ADMIN',
    action: 'update_company_status',
    entityType: 'company',
    entityId: 'company-techflow',
    entityLabel: 'ООО «TechFlow»',
    timestamp: '2026-09-24T08:10:00.000Z',
    targetType: 'company',
    targetName: 'ООО «TechFlow»',
    details: 'Статус изменён на active',
  },
  {
    id: 'audit-2',
    actorId: 'user-admin',
    actorName: 'Алексей Админов',
    role: 'PLATFORM_ADMIN',
    action: 'block_user',
    entityType: 'user',
    entityId: 'user-blocked',
    entityLabel: 'Никита Зайцев',
    timestamp: '2026-09-23T16:40:00.000Z',
    targetType: 'user',
    targetName: 'Никита Зайцев',
    details: 'Блокировка за нарушение правил',
  },
  {
    id: 'audit-3',
    actorId: 'user-olga',
    actorName: 'Ольга Морозова',
    role: 'MODERATOR',
    action: 'approve_moderation',
    entityType: 'opportunity',
    entityId: 'opp-1',
    entityLabel: 'Интеграция CRM с 1С',
    timestamp: '2026-09-23T12:05:00.000Z',
    targetType: 'opportunity',
    targetName: 'Интеграция CRM с 1С',
  },
  {
    id: 'audit-4',
    actorId: 'user-admin',
    actorName: 'Алексей Админов',
    role: 'PLATFORM_ADMIN',
    action: 'create_dictionary',
    entityType: 'dictionary',
    entityId: 'cat-iot',
    entityLabel: 'IoT-решения',
    timestamp: '2026-09-22T09:30:00.000Z',
    targetType: 'dictionary',
    targetName: 'IoT-решения',
  },
  {
    id: 'audit-5',
    actorId: 'user-pavel',
    actorName: 'Павел Соколов',
    role: 'MODERATOR',
    action: 'reject_moderation',
    entityType: 'company',
    entityId: 'company-brandpulse',
    entityLabel: 'ООО «BrandPulse»',
    timestamp: '2026-09-21T15:20:00.000Z',
    targetType: 'company',
    targetName: 'ООО «BrandPulse»',
    details: 'Расхождение ОГРН',
  },
  {
    id: 'audit-6',
    actorId: 'user-admin',
    actorName: 'Алексей Админов',
    role: 'PLATFORM_ADMIN',
    action: 'update_platform_settings',
    entityType: 'settings',
    entityId: 'platform',
    entityLabel: 'Platform settings',
    timestamp: '2026-09-21T10:00:00.000Z',
    targetType: 'settings',
    targetName: 'Platform settings',
  },
  {
    id: 'audit-7',
    actorId: 'user-admin',
    actorName: 'Алексей Админов',
    role: 'PLATFORM_ADMIN',
    action: 'send_to_moderation',
    entityType: 'company',
    entityId: 'company-packpro',
    entityLabel: 'ООО «PackPro»',
    timestamp: '2026-09-20T14:15:00.000Z',
    targetType: 'company',
    targetName: 'ООО «PackPro»',
  },
  {
    id: 'audit-8',
    actorId: 'user-olga',
    actorName: 'Ольга Морозова',
    role: 'MODERATOR',
    action: 'close_report',
    entityType: 'report',
    entityId: 'report-5',
    entityLabel: 'Spam report',
    timestamp: '2026-09-20T11:45:00.000Z',
    targetType: 'report',
    targetName: 'Spam report',
  },
  {
    id: 'audit-9',
    actorId: 'user-admin',
    actorName: 'Алексей Админов',
    role: 'PLATFORM_ADMIN',
    action: 'archive_dictionary',
    entityType: 'dictionary',
    entityId: 'tech-jquery',
    entityLabel: 'jQuery',
    timestamp: '2026-09-19T13:00:00.000Z',
    targetType: 'dictionary',
    targetName: 'jQuery',
  },
  {
    id: 'audit-10',
    actorId: 'user-admin',
    actorName: 'Алексей Админов',
    role: 'PLATFORM_ADMIN',
    action: 'unblock_user',
    entityType: 'user',
    entityId: 'user-sergey',
    entityLabel: 'Сергей Новиков',
    timestamp: '2026-09-18T09:20:00.000Z',
    targetType: 'user',
    targetName: 'Сергей Новиков',
  },
  {
    id: 'audit-11',
    actorId: 'user-pavel',
    actorName: 'Павел Соколов',
    role: 'MODERATOR',
    action: 'block_content',
    entityType: 'document',
    entityId: 'doc-fake',
    entityLabel: 'Поддельная лицензия',
    timestamp: '2026-09-17T17:50:00.000Z',
    targetType: 'document',
    targetName: 'Поддельная лицензия',
  },
  {
    id: 'audit-12',
    actorId: 'user-admin',
    actorName: 'Алексей Админов',
    role: 'PLATFORM_ADMIN',
    action: 'update_company_status',
    entityType: 'company',
    entityId: 'company-logistics-one',
    entityLabel: 'ООО «Logistics One»',
    timestamp: '2026-09-16T08:40:00.000Z',
    targetType: 'company',
    targetName: 'ООО «Logistics One»',
  },
  {
    id: 'audit-13',
    actorId: 'user-admin',
    actorName: 'Алексей Админов',
    role: 'PLATFORM_ADMIN',
    action: 'edit_dictionary',
    entityType: 'dictionary',
    entityId: 'ind-healthcare',
    entityLabel: 'Healthcare',
    timestamp: '2026-09-15T12:10:00.000Z',
    targetType: 'dictionary',
    targetName: 'Healthcare',
  },
  {
    id: 'audit-14',
    actorId: 'user-olga',
    actorName: 'Ольга Морозова',
    role: 'MODERATOR',
    action: 'request_changes',
    entityType: 'case',
    entityId: 'case-x',
    entityLabel: 'Кейс внедрения WMS',
    timestamp: '2026-09-14T16:25:00.000Z',
    targetType: 'case',
    targetName: 'Кейс внедрения WMS',
  },
  {
    id: 'audit-15',
    actorId: 'user-admin',
    actorName: 'Алексей Админов',
    role: 'PLATFORM_ADMIN',
    action: 'maintenance_toggle',
    entityType: 'settings',
    entityId: 'platform',
    entityLabel: 'Maintenance mode',
    timestamp: '2026-09-13T07:00:00.000Z',
    targetType: 'settings',
    targetName: 'Maintenance mode',
  },
]

export function appendAudit(
  input: Omit<AuditEvent, 'id' | 'timestamp'> & { timestamp?: string },
): AuditEvent {
  const event: AuditEvent = {
    id: `audit-${Date.now()}`,
    timestamp: input.timestamp ?? new Date().toISOString(),
    targetType: input.targetType ?? input.entityType,
    targetName: input.targetName ?? input.entityLabel,
    ...input,
  }
  mockAuditEvents.unshift(event)
  return event
}
