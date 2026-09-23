import { z } from 'zod'
import { OPPORTUNITY_TYPES } from '@/entities/opportunity'
import { delay } from '@/shared/lib/delay'

export const opportunityFormSchema = z.object({
  title: z.string().min(5, 'Укажите название (минимум 5 символов)'),
  description: z.string().min(20, 'Опишите задачу подробнее'),
  type: z.string().min(1),
  category: z.string().min(1, 'Выберите категорию'),
  subcategory: z.string(),
  industries: z.array(z.string()).min(1, 'Укажите хотя бы одну отрасль'),
  skills: z.array(z.string()),
  technologies: z.array(z.string()),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
  currency: z.string(),
  region: z.string().min(1, 'Укажите регион'),
  remoteAllowed: z.boolean(),
  proposalDeadline: z.string().min(1, 'Укажите дедлайн'),
  executionDeadline: z.string().nullable(),
})

export type OpportunityFormValues = z.infer<typeof opportunityFormSchema>

export interface ParsedOpportunityDraft {
  title: string
  description: string
  category: string
  industries: string[]
  technologies: string[]
  budgetMin: number | null
  budgetMax: number | null
  region: string
  remoteAllowed: boolean
  executionHint: string
}

/** Mock AI structuring — replace with real service later */
export async function parseOpportunityText(text: string): Promise<ParsedOpportunityDraft> {
  await delay(600)
  const lower = text.toLowerCase()

  const technologies: string[] = []
  if (lower.includes('react')) technologies.push('React')
  if (lower.includes('1с') || lower.includes('1c')) technologies.push('1С')
  if (lower.includes('typescript')) technologies.push('TypeScript')
  if (lower.includes('python')) technologies.push('Python')

  let category = 'Разработка ПО'
  if (lower.includes('постав')) category = 'Поставка оборудования'
  if (lower.includes('логист')) category = 'Логистика'
  if (lower.includes('маркет')) category = 'Маркетинг и реклама'

  const industries: string[] = []
  if (lower.includes('медицин') || lower.includes('клиник') || lower.includes('health')) {
    industries.push('Healthcare')
  }
  if (lower.includes('ритейл') || lower.includes('магазин')) industries.push('Retail')
  if (lower.includes('логист')) industries.push('Logistics')
  if (industries.length === 0) industries.push('IT')

  let budgetMax: number | null = null
  const budgetMatch = text.match(/(\d[\d\s]*)\s*(тыс|тысяч|млн)?/i)
  if (budgetMatch) {
    const raw = Number(budgetMatch[1].replace(/\s/g, ''))
    if (budgetMatch[2]?.startsWith('тыс')) budgetMax = raw * 1000
    else if (budgetMatch[2]?.startsWith('млн')) budgetMax = raw * 1_000_000
    else if (raw < 10000) budgetMax = raw * 1000
    else budgetMax = raw
  }
  if (lower.includes('500') && budgetMax == null) budgetMax = 500000

  return {
    title: text.slice(0, 80).trim() || 'Новый запрос',
    description: text,
    category,
    industries,
    technologies: technologies.length ? technologies : ['React'],
    budgetMin: budgetMax ? Math.round(budgetMax * 0.7) : null,
    budgetMax,
    region: 'Москва',
    remoteAllowed: true,
    executionHint: '2 месяца',
  }
}

export function draftToFormValues(draft: ParsedOpportunityDraft): OpportunityFormValues {
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 21)
  return {
    title: draft.title,
    description: draft.description,
    type: OPPORTUNITY_TYPES.SERVICE,
    category: draft.category,
    subcategory: '',
    industries: draft.industries,
    skills: [],
    technologies: draft.technologies,
    budgetMin: draft.budgetMin,
    budgetMax: draft.budgetMax,
    currency: 'RUB',
    region: draft.region,
    remoteAllowed: draft.remoteAllowed,
    proposalDeadline: deadline.toISOString().slice(0, 10),
    executionDeadline: null,
  }
}
