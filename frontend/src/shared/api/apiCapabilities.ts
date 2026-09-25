import { USE_MOCK_API } from '@/shared/config/env'

export type ApiSource = 'real' | 'mock'

/**
 * Central per-domain API mode.
 * When VITE_USE_MOCK_API=false, core domains hit FastAPI; gaps stay mock.
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
  // Backend missing or incompatible — always mock
  favorites: 'mock' as ApiSource,
  team: 'mock' as ApiSource,
  services: 'mock' as ApiSource,
  cases: 'mock' as ApiSource,
  documents: 'mock' as ApiSource,
  settings: 'mock' as ApiSource,
  verification: 'mock' as ApiSource,
  moderation: 'mock' as ApiSource,
  reports: 'mock' as ApiSource,
  admin: 'mock' as ApiSource,
  dictionaries: 'mock' as ApiSource,
  analytics: 'mock' as ApiSource,
} as const

export function isReal(domain: keyof typeof apiCapabilities): boolean {
  return apiCapabilities[domain] === 'real'
}
