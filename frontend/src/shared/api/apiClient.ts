import axios from 'axios'
import { API_BASE_URL } from '@/shared/config/env'

/**
 * HTTP client for real FastAPI backend.
 * Swap mock API modules to call this client when VITE_USE_MOCK_API=false.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('b2b_match_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    return Promise.reject(error)
  },
)
