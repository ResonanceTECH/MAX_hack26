import { create } from 'zustand'
import type { CompanyMemberRole } from '@/entities/company-member'
import type { User, SystemRole } from '@/entities/user'
import type { Company } from '@/entities/company'
import {
  getDevPersonaByMaxUserId,
  type DevPersonaId,
} from '@/features/auth/model/devPersonas'
import { authApi } from '@/shared/api/authApi'

interface SessionState {
  user: User | null
  company: Company | null
  role: SystemRole | null
  companyMemberRole: CompanyMemberRole | null
  activePersonaId: DevPersonaId | null
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  initSession: () => Promise<void>
  switchRole: (role: SystemRole) => Promise<void>
  switchPersona: (personaId: DevPersonaId) => Promise<void>
}

function resolvePersonaId(user: User, explicit?: DevPersonaId | null): DevPersonaId | null {
  if (explicit) return explicit
  return getDevPersonaByMaxUserId(user.maxUserId)?.id ?? null
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  company: null,
  role: null,
  companyMemberRole: null,
  activePersonaId: null,
  isInitialized: false,
  isLoading: false,
  error: null,
  initSession: async () => {
    set({ isLoading: true, error: null })
    try {
      const session = await authApi.getSession()
      set({
        user: session.user,
        company: session.company,
        role: session.role,
        companyMemberRole: session.user.companyMemberRole ?? null,
        activePersonaId: resolvePersonaId(session.user),
        isInitialized: true,
        isLoading: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Ошибка инициализации',
        isLoading: false,
        isInitialized: true,
      })
    }
  },
  switchRole: async (role: SystemRole) => {
    set({ isLoading: true, error: null })
    try {
      const session = await authApi.getSession(role)
      set({
        user: session.user,
        company: session.company,
        role: session.role,
        companyMemberRole: session.user.companyMemberRole ?? null,
        activePersonaId: resolvePersonaId(session.user),
        isLoading: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Ошибка смены роли',
        isLoading: false,
      })
    }
  },
  switchPersona: async (personaId: DevPersonaId) => {
    set({ isLoading: true, error: null })
    try {
      const session = await authApi.getSession({ personaId })
      set({
        user: session.user,
        company: session.company,
        role: session.role,
        companyMemberRole: session.user.companyMemberRole ?? null,
        activePersonaId: personaId,
        isLoading: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Ошибка смены персоны',
        isLoading: false,
      })
    }
  },
}))
