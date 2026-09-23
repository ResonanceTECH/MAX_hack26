export const INDUSTRIES = [
  'IT',
  'Retail',
  'Healthcare',
  'Manufacturing',
  'Logistics',
  'Marketing',
] as const

export const OPPORTUNITY_CATEGORIES = [
  'Разработка ПО',
  'Поставка оборудования',
  'Маркетинг и реклама',
  'Логистика',
  'Производство',
  'Консалтинг',
  'Партнёрство',
] as const

export const REGIONS = [
  'Москва',
  'Санкт-Петербург',
  'Новосибирск',
  'Екатеринбург',
  'Казань',
  'Нижний Новгород',
  'Россия (удалённо)',
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
