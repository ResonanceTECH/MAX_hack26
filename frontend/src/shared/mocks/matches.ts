import type { Match } from '@/entities/match'
import { MATCH_REASON_TYPES, MATCH_STATUSES } from '@/entities/match'

export const mockMatches: Match[] = [
  {
    id: 'match-1',
    opportunityId: 'opp-crm-clinics',
    companyId: 'company-digital-lab',
    score: 94,
    reasons: [
      {
        label: 'Есть опыт Healthcare',
        type: MATCH_REASON_TYPES.INDUSTRY,
        matched: true,
        description: 'В портфолио 6 проектов для медицинских компаний',
      },
      {
        label: 'Подходит бюджет',
        type: MATCH_REASON_TYPES.BUDGET,
        matched: true,
        description: 'Средний чек компании совпадает с бюджетом запроса',
      },
      {
        label: 'Совпадает стек',
        type: MATCH_REASON_TYPES.TECHNOLOGY,
        matched: true,
        description: 'React, TypeScript и 1С указаны в компетенциях',
      },
      {
        label: 'Работает в регионе',
        type: MATCH_REASON_TYPES.REGION,
        matched: true,
        description: 'Компания базируется в Москве и работает удалённо',
      },
    ],
    missingRequirements: ['Отсутствует требуемый сертификат ISO 27001'],
    status: MATCH_STATUSES.SUGGESTED,
  },
  {
    id: 'match-2',
    opportunityId: 'opp-crm-clinics',
    companyId: 'company-techflow',
    score: 81,
    reasons: [
      {
        label: 'Сильный стек React',
        type: MATCH_REASON_TYPES.TECHNOLOGY,
        matched: true,
        description: 'Команда имеет опыт корпоративных React-приложений',
      },
      {
        label: 'Бюджет на верхней границе',
        type: MATCH_REASON_TYPES.BUDGET,
        matched: true,
        description: 'Типичный бюджет проектов выше, но запрос укладывается',
      },
      {
        label: 'Мало кейсов Healthcare',
        type: MATCH_REASON_TYPES.CASES,
        matched: false,
        description: 'Только 2 проекта в медицинской отрасли',
      },
    ],
    missingRequirements: ['Нет опыта с МИС'],
    status: MATCH_STATUSES.VIEWED,
  },
  {
    id: 'match-3',
    opportunityId: 'opp-bi-dashboard',
    companyId: 'company-datacraft',
    score: 93,
    reasons: [
      {
        label: 'Специализация на BI',
        type: MATCH_REASON_TYPES.OTHER,
        matched: true,
        description: 'Основной профиль — аналитика и витрины данных',
      },
      {
        label: 'Нужные технологии',
        type: MATCH_REASON_TYPES.TECHNOLOGY,
        matched: true,
        description: 'ClickHouse, Power BI, 1С',
      },
      {
        label: 'Кейсы в Retail',
        type: MATCH_REASON_TYPES.CASES,
        matched: true,
        description: 'Есть 4 похожих кейса в ритейле',
      },
    ],
    missingRequirements: [],
    status: MATCH_STATUSES.SUGGESTED,
  },
  {
    id: 'match-4',
    opportunityId: 'opp-logistics-ural',
    companyId: 'company-logistics-one',
    score: 97,
    reasons: [
      {
        label: 'Регион совпадает',
        type: MATCH_REASON_TYPES.REGION,
        matched: true,
        description: 'База в Екатеринбурге, покрытие Урала',
      },
      {
        label: 'Профиль FTL',
        type: MATCH_REASON_TYPES.OTHER,
        matched: true,
        description: 'Регулярные FTL-рейсы — основной сервис',
      },
    ],
    missingRequirements: [],
    status: MATCH_STATUSES.CONTACTED,
  },
  {
    id: 'match-5',
    opportunityId: 'opp-packaging-supply',
    companyId: 'company-packpro',
    score: 89,
    reasons: [
      {
        label: 'Производство упаковки',
        type: MATCH_REASON_TYPES.OTHER,
        matched: true,
        description: 'Основной продукт компании',
      },
      {
        label: 'Бюджет совпадает',
        type: MATCH_REASON_TYPES.BUDGET,
        matched: true,
        description: 'Тиражи подобного объёма в портфеле',
      },
    ],
    missingRequirements: ['Нет офиса в Москве — доставка со склада НСК'],
    status: MATCH_STATUSES.SHORTLISTED,
  },
]

export function getMatchesByOpportunity(opportunityId: string): Match[] {
  return mockMatches.filter((m) => m.opportunityId === opportunityId)
}

export function getMatchForCompany(opportunityId: string, companyId: string): Match | undefined {
  return mockMatches.find((m) => m.opportunityId === opportunityId && m.companyId === companyId)
}
