export interface AppApiError {
  status?: number
  code?: string
  message: string
  details?: unknown
}

function detailToMessage(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'msg' in item) {
          const loc = 'loc' in item && Array.isArray((item as { loc: unknown }).loc)
            ? (item as { loc: unknown[] }).loc.join('.')
            : ''
          return loc ? `${loc}: ${(item as { msg: string }).msg}` : (item as { msg: string }).msg
        }
        return JSON.stringify(item)
      })
      .join('; ')
  }
  if (detail && typeof detail === 'object') return JSON.stringify(detail)
  return 'Ошибка запроса'
}

export function normalizeApiError(error: unknown): AppApiError {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const ax = error as {
      response?: { status?: number; data?: { detail?: unknown; error?: { code?: string; message?: string } } }
      message?: string
    }
    const status = ax.response?.status
    const data = ax.response?.data
    if (data?.error?.message) {
      return { status, code: data.error.code, message: data.error.message, details: data }
    }
    if (data?.detail !== undefined) {
      return { status, message: detailToMessage(data.detail), details: data.detail }
    }
    if (status === 401) return { status, code: 'unauthorized', message: 'Требуется авторизация' }
    if (status === 403) return { status, code: 'forbidden', message: 'Нет доступа' }
    if (status === 404) return { status, code: 'not_found', message: 'Не найдено' }
    if (status === 409) return { status, code: 'conflict', message: 'Конфликт данных' }
    if (status === 422) return { status, code: 'validation', message: 'Ошибка валидации' }
    return { status, message: ax.message || 'Ошибка сети' }
  }
  if (error instanceof Error) return { message: error.message }
  return { message: 'Неизвестная ошибка' }
}

export function toApiError(error: unknown): Error {
  const normalized = normalizeApiError(error)
  const err = new Error(normalized.message)
  ;(err as Error & { status?: number; code?: string }).status = normalized.status
  ;(err as Error & { status?: number; code?: string }).code = normalized.code
  return err
}
