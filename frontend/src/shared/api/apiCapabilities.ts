import { USE_MOCK_API } from '@/shared/config/env'

export type ApiSource = 'real' | 'mock'

/**
 * Central per-domain API mode.
 * When VITE_USE_MOCK_API=false, implemented domains hit FastAPI.
 */
export const apiCapabilities = {
  auth: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  companies: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  opportunities: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  proposals: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  matching: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  deals: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  notifications: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  shortlist: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  favorites: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  team: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  services: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  cases: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  documents: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  settings: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  verification: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  moderation: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  reports: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  admin: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  dictionaries: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
  analytics: (USE_MOCK_API ? 'mock' : 'real') as ApiSource,
} as const

export function isReal(domain: keyof typeof apiCapabilities): boolean {
  return apiCapabilities[domain] === 'real'
}
