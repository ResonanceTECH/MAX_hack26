import {
  COMPANY_ACTIVITY_TYPE,
  type CompanyActivityEvent,
} from '@/entities/company-activity'
import { CURRENT_COMPANY_ID } from './user'

export const mockCompanyActivity: CompanyActivityEvent[] = [
  {
    id: 'act-1',
    companyId: CURRENT_COMPANY_ID,
    type: COMPANY_ACTIVITY_TYPE.PROFILE_UPDATED,
    actorName: 'Анна Смирнова',
    action: 'обновила описание компании',
    entityLabel: 'Профиль',
    createdAt: '2025-09-25T11:32:00.000Z',
  },
  {
    id: 'act-2',
    companyId: CURRENT_COMPANY_ID,
    type: COMPANY_ACTIVITY_TYPE.SERVICE_CREATED,
    actorName: 'Максим Орлов',
    action: 'добавил услугу',
    entityLabel: 'Внедрение BI-дашбордов',
    createdAt: '2025-09-25T09:18:00.000Z',
  },
  {
    id: 'act-3',
    companyId: CURRENT_COMPANY_ID,
    type: COMPANY_ACTIVITY_TYPE.DOCUMENT_UPLOADED,
    actorName: 'Дмитрий Волков',
    action: 'загрузил документ',
    entityLabel: 'Сертификат ISO 9001',
    createdAt: '2025-09-24T16:05:00.000Z',
  },
  {
    id: 'act-4',
    companyId: CURRENT_COMPANY_ID,
    type: COMPANY_ACTIVITY_TYPE.MEMBER_INVITED,
    actorName: 'Анна Смирнова',
    action: 'пригласила сотрудника',
    entityLabel: 'Алексей Миронов',
    createdAt: '2025-09-10T14:00:00.000Z',
  },
  {
    id: 'act-5',
    companyId: CURRENT_COMPANY_ID,
    type: COMPANY_ACTIVITY_TYPE.CASE_UPDATED,
    actorName: 'Игорь Соколов',
    action: 'обновил кейс',
    entityLabel: 'CRM для сети клиник «Здоровье+»',
    createdAt: '2025-09-08T12:40:00.000Z',
  },
  {
    id: 'act-6',
    companyId: CURRENT_COMPANY_ID,
    type: COMPANY_ACTIVITY_TYPE.MEMBER_ROLE_CHANGED,
    actorName: 'Анна Смирнова',
    action: 'изменила роль сотрудника',
    entityLabel: 'Мария Котова → Наблюдатель',
    createdAt: '2025-08-20T10:15:00.000Z',
  },
  {
    id: 'act-7',
    companyId: CURRENT_COMPANY_ID,
    type: COMPANY_ACTIVITY_TYPE.SETTINGS_UPDATED,
    actorName: 'Анна Смирнова',
    action: 'обновила настройки видимости',
    entityLabel: 'Настройки',
    createdAt: '2025-08-01T09:00:00.000Z',
  },
]

export function resetMockCompanyActivity(next: CompanyActivityEvent[]): void {
  mockCompanyActivity.splice(0, mockCompanyActivity.length, ...next)
}
