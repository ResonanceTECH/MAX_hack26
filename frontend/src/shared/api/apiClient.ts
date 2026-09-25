import axios from 'axios'
import { API_BASE_URL } from '@/shared/config/env'
import { TOKEN_STORAGE_KEY } from '@/shared/api/mappers/userMapper'
import { normalizeApiError } from '@/shared/api/errors'

/**
 * HTTP client for FastAPI backend (root paths, no /api/v1).
 * Domain modules switch via apiCapabilities when VITE_USE_MOCK_API=false.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalized = normalizeApiError(error)
    if (import.meta.env.DEV && normalized.status !== 401) {
      console.warn('[api]', normalized.status, normalized.message)
    }
    return Promise.reject(error)
  },
)
