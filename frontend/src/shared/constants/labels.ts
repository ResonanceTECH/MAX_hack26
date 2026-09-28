// Значения синхронизированы с бэкендом: GET /api/dictionaries
// (categories из structurizer CATEGORIES, regions из structurizer REGIONS).
export const INDUSTRIES = [
  'IT-разработка',
  'Маркетинг и реклама',
  'Производство',
  'Логистика',
  'Строительство и ремонт',
  'Бухгалтерия и финансы',
  'Дизайн',
] as const

export const OPPORTUNITY_CATEGORIES = INDUSTRIES

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
  'Вся Россия',
] as const

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
  shortlisting: 'Shortlist',
  negotiation: 'Переговоры',
  closed: 'Закрыт',
  cancelled: 'Отменён',
  expired: 'Истёк',
}

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  submitted: 'Отправлено',
  viewed: 'Просмотрено',
  shortlisted: 'В shortlist',
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
