export type FeatureFlagScope = 'GLOBAL' | 'TEST'

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string
  enabled: boolean
  scope: FeatureFlagScope
  updatedAt: string
  updatedBy: string
}

export const mockFeatureFlags: FeatureFlag[] = [
  {
    id: 'flag-matching-v2',
    key: 'matching_v2',
    name: 'Matching v2',
    description: 'Новый алгоритм рекомендаций контрагентов',
    enabled: true,
    scope: 'TEST',
    updatedAt: '2026-09-09T09:00:00.000Z',
    updatedBy: 'Ирина Соколова',
  },
  {
    id: 'flag-deal-room',
    key: 'deal_room',
    name: 'Deal Room',
    description: 'Комната переговоров и документов по сделке',
    enabled: false,
    scope: 'GLOBAL',
    updatedAt: '2026-09-01T10:00:00.000Z',
    updatedBy: 'Александр Иванов',
  },
  {
    id: 'flag-company-verification',
    key: 'company_verification',
    name: 'Company verification',
    description: 'Расширенный flow верификации компании',
    enabled: true,
    scope: 'GLOBAL',
    updatedAt: '2026-08-20T12:00:00.000Z',
    updatedBy: 'Александр Иванов',
  },
  {
    id: 'flag-saved-search',
    key: 'saved_search',
    name: 'Saved search',
    description: 'Сохранённые поиски возможностей',
    enabled: true,
    scope: 'GLOBAL',
    updatedAt: '2026-08-15T08:00:00.000Z',
    updatedBy: 'Ирина Соколова',
  },
  {
    id: 'flag-reviews',
    key: 'reviews',
    name: 'Reviews',
    description: 'Отзывы о компаниях после сделки',
    enabled: false,
    scope: 'TEST',
    updatedAt: '2026-07-30T14:00:00.000Z',
    updatedBy: 'Александр Иванов',
  },
  {
    id: 'flag-advanced-filters',
    key: 'advanced_filters',
    name: 'Advanced filters',
    description: 'Расширенные фильтры в каталоге',
    enabled: true,
    scope: 'GLOBAL',
    updatedAt: '2026-07-10T11:00:00.000Z',
    updatedBy: 'Ирина Соколова',
  },
]

export function getFeatureFlagById(id: string): FeatureFlag | undefined {
  return mockFeatureFlags.find((f) => f.id === id || f.key === id)
}
