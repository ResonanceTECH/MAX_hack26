import {
  MODERATION_ACTION,
  MODERATION_ENTITY_TYPES,
  MODERATION_STATUS,
  type ModerationDecision,
  type ModerationHistoryEntry,
} from '@/entities/moderation'

function decision(
  partial: Omit<ModerationDecision, 'fieldsRequested' | 'privateNote' | 'reasonCode' | 'comment'> &
    Partial<ModerationDecision>,
): ModerationDecision {
  return {
    reasonCode: null,
    comment: null,
    fieldsRequested: [],
    privateNote: null,
    ...partial,
  }
}

/** Mutable moderation decision history */
export const mockModerationHistory: ModerationHistoryEntry[] = [
  {
    id: 'hist-1',
    moderationItemId: 'mod-o3',
    entityType: MODERATION_ENTITY_TYPES.OPPORTUNITY,
    entityId: 'opp-logistics-ftl',
    title: 'FTL-перевозки Урал — Сибирь',
    companyName: 'PackPro',
    decision: decision({
      id: 'dec-1',
      moderationItemId: 'mod-o3',
      moderatorId: 'user-moderator',
      moderatorName: 'Елена Морозова',
      action: MODERATION_ACTION.APPROVED,
      previousStatus: MODERATION_STATUS.IN_REVIEW,
      newStatus: MODERATION_STATUS.APPROVED,
      createdAt: '2026-09-20T11:30:00.000Z',
    }),
  },
  {
    id: 'hist-2',
    moderationItemId: 'mod-c8',
    entityType: MODERATION_ENTITY_TYPES.COMPANY,
    entityId: 'company-brandpulse',
    title: 'BrandPulse',
    companyName: 'BrandPulse',
    decision: decision({
      id: 'dec-2',
      moderationItemId: 'mod-c8',
      moderatorId: 'user-moderator',
      moderatorName: 'Елена Морозова',
      action: MODERATION_ACTION.REJECTED,
      reasonCode: 'INVALID_DATA',
      comment: 'Расхождение ОГРН в карточке и выписке',
      previousStatus: MODERATION_STATUS.IN_REVIEW,
      newStatus: MODERATION_STATUS.REJECTED,
      createdAt: '2026-09-19T17:05:00.000Z',
    }),
  },
  {
    id: 'hist-3',
    moderationItemId: 'mod-k2',
    entityType: MODERATION_ENTITY_TYPES.CASE,
    entityId: 'case-techflow-portal',
    title: 'Корпоративный портал для завода',
    companyName: 'TechFlow',
    decision: decision({
      id: 'dec-3',
      moderationItemId: 'mod-k2',
      moderatorId: 'user-moderator',
      moderatorName: 'Елена Морозова',
      action: MODERATION_ACTION.CHANGES_REQUESTED,
      comment: 'Добавьте согласие клиента и источники метрик',
      fieldsRequested: ['result', 'description'],
      previousStatus: MODERATION_STATUS.IN_REVIEW,
      newStatus: MODERATION_STATUS.NEEDS_CHANGES,
      createdAt: '2026-09-22T15:40:00.000Z',
    }),
  },
  {
    id: 'hist-4',
    moderationItemId: 'mod-k3',
    entityType: MODERATION_ENTITY_TYPES.CASE,
    entityId: 'case-packpro-eco',
    title: 'Эко-упаковка для маркетплейса',
    companyName: 'PackPro',
    decision: decision({
      id: 'dec-4',
      moderationItemId: 'mod-k3',
      moderatorId: 'user-admin',
      moderatorName: 'Алексей Админов',
      action: MODERATION_ACTION.BLOCKED,
      reasonCode: 'FORBIDDEN_CONTENT',
      comment: 'Недостоверные цифры тиража по жалобам',
      previousStatus: MODERATION_STATUS.IN_REVIEW,
      newStatus: MODERATION_STATUS.BLOCKED,
      createdAt: '2026-09-18T16:00:00.000Z',
    }),
  },
  {
    id: 'hist-5',
    moderationItemId: 'mod-d5',
    entityType: MODERATION_ENTITY_TYPES.DOCUMENT,
    entityId: 'doc-packpro-gost',
    title: 'Сертификат соответствия ГОСТ',
    companyName: 'PackPro',
    decision: decision({
      id: 'dec-5',
      moderationItemId: 'mod-d5',
      moderatorId: 'user-moderator',
      moderatorName: 'Елена Морозова',
      action: MODERATION_ACTION.APPROVED,
      previousStatus: MODERATION_STATUS.PENDING,
      newStatus: MODERATION_STATUS.APPROVED,
      createdAt: '2026-09-10T09:20:00.000Z',
    }),
  },
  {
    id: 'hist-6',
    moderationItemId: 'mod-c5',
    entityType: MODERATION_ENTITY_TYPES.COMPANY,
    entityId: 'company-datacraft',
    title: 'DataCraft',
    companyName: 'DataCraft',
    decision: decision({
      id: 'dec-legacy-1',
      moderationItemId: 'mod-c5',
      moderatorId: 'user-moderator',
      moderatorName: 'Елена Морозова',
      action: MODERATION_ACTION.CHANGES_REQUESTED,
      comment: 'Уточните описание услуг и добавьте корректную ссылку на сайт.',
      fieldsRequested: ['description', 'website'],
      previousStatus: MODERATION_STATUS.IN_REVIEW,
      newStatus: MODERATION_STATUS.NEEDS_CHANGES,
      createdAt: '2026-09-23T12:00:00.000Z',
      privateNote: 'Повторная проверка после исправления сайта',
    }),
  },
]

export const mockOwnerNotifications: { id: string; title: string; body: string; createdAt: string }[] =
  []
