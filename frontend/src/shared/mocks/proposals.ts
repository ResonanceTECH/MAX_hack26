import type { Proposal } from '@/entities/proposal'
import { PROPOSAL_STATUSES } from '@/entities/proposal'
import { mockCompanies } from './companies'

const company = (id: string) => {
  const found = mockCompanies.find((c) => c.id === id)
  if (!found) throw new Error(`Company not found: ${id}`)
  return found
}

export const mockProposals: Proposal[] = [
  {
    id: 'prop-1',
    opportunityId: 'opp-crm-clinics',
    company: company('company-digital-lab'),
    price: 480000,
    currency: 'RUB',
    durationDays: 60,
    description:
      'Предлагаем MVP CRM за 8 недель: пациенты, запись, роли, интеграция с 1С. Дальше — развитие по roadmap.',
    included: ['Дизайн интерфейсов', 'Интеграция с 1С', 'Обучение администраторов'],
    excluded: ['Интеграция с МИС (отдельный этап)', 'Хостинг'],
    cases: ['CRM для сети стоматологий', 'Личный кабинет клиники'],
    status: PROPOSAL_STATUSES.SUBMITTED,
    createdAt: '2026-09-18T11:00:00.000Z',
  },
  {
    id: 'prop-2',
    opportunityId: 'opp-crm-clinics',
    company: company('company-techflow'),
    price: 520000,
    currency: 'RUB',
    durationDays: 75,
    description:
      'Корпоративная CRM на React + Java. Включаем нагрузочное тестирование и DevOps-контур.',
    included: ['Микросервисная архитектура', 'CI/CD', 'Документация API'],
    excluded: ['Лицензии сторонних систем'],
    cases: ['Портал клиники', 'Система записи пациентов'],
    status: PROPOSAL_STATUSES.VIEWED,
    createdAt: '2026-09-19T09:30:00.000Z',
  },
  {
    id: 'prop-3',
    opportunityId: 'opp-crm-clinics',
    company: company('company-datacraft'),
    price: 390000,
    currency: 'RUB',
    durationDays: 50,
    description:
      'Лёгкая CRM с акцентом на аналитику записи и загрузки врачей. Быстрый старт на готовых модулях.',
    included: ['Дашборды загрузки', 'Импорт из Excel', 'Базовая интеграция с 1С'],
    excluded: ['Мобильное приложение'],
    cases: ['Аналитика для медцентра'],
    status: PROPOSAL_STATUSES.SHORTLISTED,
    createdAt: '2026-09-17T15:00:00.000Z',
  },
  {
    id: 'prop-4',
    opportunityId: 'opp-wms-retail',
    company: company('company-logistics-one'),
    price: 1100000,
    currency: 'RUB',
    durationDays: 120,
    description: 'Внедрение WMS с обучением персонала и интеграцией с маркетплейсами.',
    included: ['Обследование склада', 'Обучение', 'Поддержка 3 месяца'],
    excluded: ['Закупка оборудования'],
    cases: ['WMS для fashion-ритейла'],
    status: PROPOSAL_STATUSES.SUBMITTED,
    createdAt: '2026-09-15T10:00:00.000Z',
  },
  {
    id: 'prop-5',
    opportunityId: 'opp-leadgen-b2b',
    company: company('company-brandpulse'),
    price: 320000,
    currency: 'RUB',
    durationDays: 90,
    description: 'ABM + inbound на Manufacturing. Гарантия 40 MQL при выполнении брифа.',
    included: ['Стратегия ABM', 'Контент-пак', 'Настройка рекламы'],
    excluded: ['CRM заказчика'],
    cases: ['Лидогенерация для ERP-вендора'],
    status: PROPOSAL_STATUSES.NEGOTIATION,
    createdAt: '2026-09-20T12:00:00.000Z',
  },
  {
    id: 'prop-6',
    opportunityId: 'opp-bi-dashboard',
    company: company('company-digital-lab'),
    price: 450000,
    currency: 'RUB',
    durationDays: 45,
    description:
      'Соберём витрину продаж и остатков на React + ClickHouse. Digital Lab как исполнитель.',
    included: ['DWH-слой', 'Дашборды Power BI', 'Интеграция с 1С'],
    excluded: ['Лицензии Power BI'],
    cases: ['Аналитика для медсети', 'Дашборды ритейла'],
    status: PROPOSAL_STATUSES.VIEWED,
    createdAt: '2026-09-21T10:00:00.000Z',
  },
  {
    id: 'prop-7',
    opportunityId: 'opp-mis-integration',
    company: company('company-digital-lab'),
    price: 720000,
    currency: 'RUB',
    durationDays: 70,
    description: 'Двусторонняя интеграция МИС↔ЛИС с поддержкой FHIR.',
    included: ['Обследование', 'Адаптеры FHIR', 'Тестовый контур'],
    excluded: ['Лицензии МИС'],
    cases: ['Интеграция клиники с лабораторией'],
    status: PROPOSAL_STATUSES.SHORTLISTED,
    createdAt: '2026-09-16T14:00:00.000Z',
  },
  {
    id: 'prop-8',
    opportunityId: 'opp-dl-ecommerce',
    company: company('company-techflow'),
    price: 820000,
    currency: 'RUB',
    durationDays: 90,
    description: 'B2B-витрина на React с каталогом, корзиной и 1С.',
    included: ['Каталог', 'Корзина', 'Интеграция 1С', 'Админка'],
    excluded: ['Маркетинг'],
    cases: ['Корпоративный портал', 'E-commerce B2B'],
    status: PROPOSAL_STATUSES.SUBMITTED,
    createdAt: '2026-09-22T09:00:00.000Z',
  },
]

export function getProposalById(id: string): Proposal | undefined {
  return mockProposals.find((p) => p.id === id)
}

export function getProposalsByOpportunity(opportunityId: string): Proposal[] {
  return mockProposals.filter((p) => p.opportunityId === opportunityId)
}
