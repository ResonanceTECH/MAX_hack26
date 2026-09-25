import type { Report } from '@/entities/report'

/** Mutable in-memory reports */
export const mockReports: Report[] = [
  {
    id: 'report-1',
    reason: 'Fake company',
    reporterName: 'Анна Смирнова',
    targetName: 'ООО «МедСнаб Плюс»',
    entityType: 'company',
    entityId: 'company-medsupply',
    description: 'В выписке ЕГРЮЛ другой юридический адрес, чем в карточке на платформе.',
    status: 'open',
    createdAt: '2026-09-24T10:05:00.000Z',
  },
  {
    id: 'report-2',
    reason: 'Spam',
    reporterName: 'Павел Нестеров',
    targetName: 'Поставка упаковки для e-commerce',
    entityType: 'opportunity',
    entityId: 'opp-packaging-supply',
    description: 'Похожий запрос публикуется третий раз за неделю с разными бюджетами.',
    status: 'open',
    createdAt: '2026-09-23T18:40:00.000Z',
  },
  {
    id: 'report-3',
    reason: 'Inappropriate content',
    reporterName: 'Мария Орлова',
    targetName: 'Кейс: эко-упаковка для маркетплейса',
    entityType: 'case',
    entityId: 'case-packpro-eco',
    description: 'В описании кейса указаны персональные данные сотрудников клиента.',
    status: 'action_taken',
    createdAt: '2026-09-18T14:15:00.000Z',
  },
  {
    id: 'report-4',
    reason: 'Fraud',
    reporterName: 'Игорь Васильев',
    targetName: 'ООО «BrandPulse»',
    entityType: 'company',
    entityId: 'company-brandpulse',
    description: 'Компания запросила предоплату вне платформы и исчезла из переписки.',
    status: 'open',
    createdAt: '2026-09-22T09:30:00.000Z',
  },
  {
    id: 'report-5',
    reason: 'Spam',
    reporterName: 'Елена Кузнецова',
    targetName: 'Алексей Григорьев',
    entityType: 'user',
    entityId: 'user-alexey',
    description: 'Массовая рассылка коммерческих предложений в чатах сделок.',
    status: 'closed',
    createdAt: '2026-09-15T12:00:00.000Z',
  },
  {
    id: 'report-6',
    reason: 'Other',
    reporterName: 'Сергей Морозов',
    targetName: 'Лицензия на ПО — CloudNest',
    entityType: 'document',
    entityId: 'doc-cloudnest-license',
    description: 'Файл не открывается, возможно повреждён или подменён.',
    status: 'open',
    createdAt: '2026-09-21T16:20:00.000Z',
  },
]

export function getReportById(id: string): Report | undefined {
  return mockReports.find((r) => r.id === id)
}
