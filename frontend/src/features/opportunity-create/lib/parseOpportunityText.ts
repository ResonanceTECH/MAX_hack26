import { z } from 'zod'
import { OPPORTUNITY_TYPES } from '@/entities/opportunity'
import { apiClient } from '@/shared/api/apiClient'
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

/** Backend CATEGORIES → labels формы создания запроса */
const CATEGORY_TO_UI: Record<string, string> = {
  'IT-разработка': 'Разработка ПО',
  'Маркетинг и реклама': 'Маркетинг и реклама',
  Логистика: 'Логистика',
  Производство: 'Производство',
  'Строительство и ремонт': 'Производство',
  'Бухгалтерия и финансы': 'Консалтинг',
  Дизайн: 'Консалтинг',
}

interface StructuredRequestDto {
  title: string
  category: string
  subcategory?: string | null
  requirements?: string[]
  budget_min?: number | null
  budget_max?: number | null
  deadline_days?: number | null
  regions?: string[]
  extracted?: { source?: string }
}

function mapApiToDraft(data: StructuredRequestDto, rawText: string): ParsedOpportunityDraft {
  const technologies = (data.requirements ?? []).map(String).filter(Boolean)
  const days = data.deadline_days
  let executionHint = 'Срок не указан'
  if (days != null) {
    if (days >= 30 && days % 30 === 0) executionHint = `${days / 30} мес.`
    else if (days >= 7 && days % 7 === 0) executionHint = `${days / 7} нед.`
    else executionHint = `${days} дн.`
  }

  const backendCategory = data.category || ''
  const category = CATEGORY_TO_UI[backendCategory] ?? backendCategory ?? 'Разработка ПО'
  const region = data.regions?.[0] || 'Москва'

  return {
    title: (data.title || rawText.slice(0, 80)).trim() || 'Новый запрос',
    description: rawText,
    category,
    industries: guessIndustries(rawText, category, backendCategory),
    technologies: technologies.length ? technologies : guessTechnologies(rawText),
    budgetMin: data.budget_min ?? null,
    budgetMax: data.budget_max ?? null,
    region,
    remoteAllowed: /удал[её]н|remote|вся россия/i.test(rawText + ' ' + region),
    executionHint,
  }
}

function guessIndustries(text: string, category: string, backendCategory = ''): string[] {
  const lower = `${text} ${category} ${backendCategory}`.toLowerCase()
  const industries: string[] = []

  if (/медицин|клиник|health|лаборатор/.test(lower)) industries.push('Healthcare')
  if (/ритейл|магазин|торгов|e-?commerce/.test(lower)) industries.push('Retail')
  if (/логист|доставк|фулфилмент|склад/.test(lower)) industries.push('Logistics')
  if (/маркет|smm|реклам|seo|бренд/.test(lower)) industries.push('Marketing')
  if (/ремонт|строител|отделк|обои|квартир|офис|монтаж|фасад/.test(lower)) {
    industries.push('Manufacturing')
  }
  if (/производств|мебел|полиграф|упаковк/.test(lower) && !industries.includes('Manufacturing')) {
    industries.push('Manufacturing')
  }

  if (industries.length === 0) {
    if (category.includes('Логистик') || backendCategory.includes('Логистик')) {
      industries.push('Logistics')
    } else if (category.includes('Маркетинг') || backendCategory.includes('Маркетинг')) {
      industries.push('Marketing')
    } else if (
      category.includes('Производ') ||
      backendCategory.includes('Производ') ||
      backendCategory.includes('Строительство')
    ) {
      industries.push('Manufacturing')
    } else if (category.includes('Разработка') || backendCategory.includes('IT')) {
      industries.push('IT')
    } else {
      // неизвестная категория — не подставляем IT «по умолчанию»
      industries.push('Manufacturing')
    }
  }
  return industries
}

function guessTechnologies(text: string): string[] {
  const lower = text.toLowerCase()
  const technologies: string[] = []
  if (lower.includes('react')) technologies.push('React')
  if (lower.includes('1с') || lower.includes('1c')) technologies.push('1С')
  if (lower.includes('typescript')) technologies.push('TypeScript')
  if (lower.includes('python')) technologies.push('Python')
  return technologies
}

/** Normalize "100 000" / "100.000" / "100,000" → integer rubles. */
export function normalizeBudgetAmountToken(raw: string): number | null {
  let s = raw.replace(/[\s\u00A0\u202F]/g, '')
  if (!s) return null

  // Thousand separators: 1.000.000 or 100,000
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '')
  } else if (/^\d{1,3}(,\d{3})+$/.test(s)) {
    s = s.replace(/,/g, '')
  } else {
    // Drop any leftover non-digits (avoid partial junk from "1С")
    s = s.replace(/[^\d]/g, '')
  }

  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function suffixMultiplier(suffix: string | undefined): number {
  if (!suffix) return 1
  const s = suffix.toLowerCase()
  if (s.startsWith('тыс')) return 1000
  if (s.startsWith('млн') || s.startsWith('миллион')) return 1_000_000
  return 1
}

/**
 * Extract budget from free text using budget context only —
 * never the first digit in the whole string (avoids "1С" → 1000).
 */
export function parseBudgetFromText(text: string): number | null {
  const patterns: RegExp[] = [
    /бюджет[^0-9]{0,24}(?:до|от)?[^0-9]{0,8}(\d[\d\s\u00A0\u202F.,]*)\s*(тыс(?:яч(?:и)?)?|млн|миллион(?:а|ов)?|руб(?:лей|ля|\.)?|₽)?/i,
    /(?:^|[^\d])(?:до|от)\s+(\d[\d\s\u00A0\u202F.,]*)\s*(тыс(?:яч(?:и)?)?|млн|миллион(?:а|ов)?)\b/i,
    /(\d[\d\s\u00A0\u202F.,]*)\s*(тыс(?:яч(?:и)?)?|млн|миллион(?:а|ов)?)\b/i,
    /(\d[\d\s\u00A0\u202F.,]*)\s*(?:руб(?:лей|ля|\.)?|₽)/i,
  ]

  for (const re of patterns) {
    const match = text.match(re)
    if (!match?.[1]) continue
    const raw = normalizeBudgetAmountToken(match[1])
    if (raw == null) continue
    const mult = suffixMultiplier(match[2])
    // Ignore tiny artifacts without explicit money/multiplier suffix
    if (mult === 1 && raw < 10 && !/руб|₽/i.test(match[0])) continue
    return raw * mult
  }

  return null
}

/** Локальный фолбэк, если LLM/API недоступны (тесты, офлайн). */
export async function parseOpportunityTextLocal(text: string): Promise<ParsedOpportunityDraft> {
  await delay(200)
  const lower = text.toLowerCase()
  const technologies = guessTechnologies(text)

  let category = 'Разработка ПО'
  let backendCategory = 'IT-разработка'
  if (lower.includes('постав')) {
    category = 'Поставка оборудования'
    backendCategory = 'Производство'
  }
  if (lower.includes('логист')) {
    category = 'Логистика'
    backendCategory = 'Логистика'
  }
  if (lower.includes('маркет')) {
    category = 'Маркетинг и реклама'
    backendCategory = 'Маркетинг и реклама'
  }
  if (/ремонт|строител|отделк|обои|квартир/.test(lower)) {
    category = 'Производство'
    backendCategory = 'Строительство и ремонт'
  }

  const budgetMax = parseBudgetFromText(text)

  const industries = guessIndustries(text, category, backendCategory)
  const tech =
    technologies.length > 0
      ? technologies
      : industries.includes('IT')
        ? ['React']
        : []

  return {
    title: text.slice(0, 80).trim() || 'Новый запрос',
    description: text,
    category,
    industries,
    technologies: tech,
    budgetMin: budgetMax ? Math.round(budgetMax * 0.7) : null,
    budgetMax,
    region: 'Москва',
    remoteAllowed: industries.includes('IT'),
    executionHint: '2 месяца',
  }
}

/** Smart Request Builder: бэкенд LLM (/api/ai/parse-opportunity), иначе локальный фолбэк. */
export async function parseOpportunityText(text: string): Promise<ParsedOpportunityDraft> {
  try {
    const { data } = await apiClient.post<StructuredRequestDto>('/ai/parse-opportunity', {
      description: text,
    })
    return mapApiToDraft(data, text)
  } catch {
    return parseOpportunityTextLocal(text)
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
