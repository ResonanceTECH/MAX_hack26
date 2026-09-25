export function formatCurrency(
  amount: number,
  currency = 'RUB',
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount)
}

export function formatBudgetRange(
  min: number | null,
  max: number | null,
  currency = 'RUB',
): string {
  if (min != null && max != null) {
    return `${formatCurrency(min, currency)}–${formatCurrency(max, currency)}`
  }
  if (max != null) return `до ${formatCurrency(max, currency)}`
  if (min != null) return `от ${formatCurrency(min, currency)}`
  return 'Бюджет не указан'
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / (1000 * 60))
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'вчера'
  if (days < 7) return `${days} дн. назад`
  return formatDate(iso)
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return many
  if (last > 1 && last < 5) return few
  if (last === 1) return one
  return many
}
