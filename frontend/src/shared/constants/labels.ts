// Справочники UI. Категория ≠ отрасль:
// - OPPORTUNITY_CATEGORIES — тип услуги / предмет запроса (filters «Категория», create form)
// - INDUSTRIES — вертикаль рынка заказчика (Healthcare, Retail…; filters «Отрасль»)
// Backend structurizer.CATEGORIES мапится в UI-категории через CATEGORY_TO_UI в parseOpportunityText.

/** Тип услуги / предмет запроса (не отрасль). */
export const OPPORTUNITY_CATEGORIES = [
  'Разработка ПО',
  'Маркетинг и реклама',
  'Логистика',
  'Производство',
  'Консалтинг',
  'Поставка оборудования',
  'Поставки',
  'Партнёрство',
  'Дизайн',
  'ИБ и безопасность',
  'Облачные сервисы',
  'Аналитика и BI',
  'AI / ML',
  'Поддержка и аутсорсинг',
  'Обучение',
  'Оборудование',
  'Упаковка',
  'Прочее',
] as const

/** Отрасль / вертикаль рынка (не путать с категорией услуги). */
export const INDUSTRIES = [
  'IT',
  'Business Automation',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Logistics',
  'Marketing',
  'Finance',
  'Education',
  'Energy',
  'Construction',
  'Agro',
  'Web',
] as const

export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number]
export type Industry = (typeof INDUSTRIES)[number]

export const COMPANY_SERVICES = [
  'web-разработка',
  'мобильная разработка',
  'интеграции',
  'автоматизация',
  'smm-продвижение',
  'контекстная реклама',
  'seo',
  'брендинг',
  'мебель на заказ',
  'упаковка',
  'металлообработка',
  'полиграфия',
  'поставка сырья',
  'доставка по городу',
  'грузоперевозки',
  'фулфилмент',
  'складские услуги',
  'строительство',
  'ремонт помещений',
  'отделочные работы',
  'проектирование',
  'бухгалтерское сопровождение',
  'налоговый консалтинг',
  'аудит',
  'графический дизайн',
  'дизайн упаковки',
] as const

export const REGIONS = [
  'Москва',
  'Санкт-Петербург',
  'Казань',
  'Екатеринбург',
  'Новосибирск',
  'Самара',
  'Нижний Новгород',
  'Краснодар',
  'Ростов-на-Дону',
  'Уфа',
  'Пермь',
  'Челябинск',
  'Омск',
  'Красноярск',
  'Воронеж',
  'Волгоград',
  'Сочи',
  'Тюмень',
  'Ижевск',
  'Калининград',
  'Владивосток',
  'Хабаровск',
  'Иркутск',
  'Томск',
  'Ярославль',
  'Рязань',
  'Тула',
  'Саратов',
  'Севастополь',
  'Крым',
  'Московская область',
  'Ленинградская область',
  'Татарстан',
  'Свердловская область',
  'Вся Россия',
  'Россия',
] as const

export type Region = (typeof REGIONS)[number]

/** Case/ё-insensitive substring match for region typeahead. */
export function filterRegions(query: string, options: readonly string[] = REGIONS): string[] {
  const q = query.trim().toLowerCase().replaceAll('ё', 'е')
  if (!q) return [...options]
  return options.filter((r) => r.toLowerCase().replaceAll('ё', 'е').includes(q))
}

export const CURRENCIES = {
  RUB: 'RUB',
  USD: 'USD',
  EUR: 'EUR',
} as const

export const OPPORTUNITY_TYPE_LABELS: Record<string, string> = {
  service: 'Услуга',
  supply: 'Поставка',
  partnership: 'Партнёрство',
  production: 'Производство',
  distribution: 'Дистрибуция',
  pilot: 'Пилот',
}

export const OPPORTUNITY_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  collecting_proposals: 'Сбор предложений',
  shortlisting: 'Шортлист',
  negotiation: 'Переговоры',
  closed: 'Закрыт',
  cancelled: 'Отменён',
  expired: 'Истёк',
}

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  submitted: 'Отправлено',
  viewed: 'Просмотрено',
  shortlisted: 'В шортлисте',
  negotiation: 'Переговоры',
  accepted: 'Принято',
  rejected: 'Отклонено',
  withdrawn: 'Отозвано',
}

export const DEAL_STATUS_LABELS: Record<string, string> = {
  negotiation: 'Переговоры',
  agreement: 'Согласование',
  closed: 'Закрыта',
  cancelled: 'Отменена',
}

export const WORK_FORMATS = {
  ONSITE: 'onsite',
  REMOTE: 'remote',
  HYBRID: 'hybrid',
} as const
