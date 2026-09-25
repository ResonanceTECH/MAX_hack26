import { create } from 'zustand'
import type { User, SystemRole } from '@/entities/user'
import type { Company } from '@/entities/company'
import { authApi } from '@/shared/api/authApi'

interface SessionState {
  user: User | null
  company: Company | null
  role: SystemRole | null
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  initSession: () => Promise<void>
  switchRole: (role: SystemRole) => Promise<void>
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  company: null,
  role: null,
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
        isLoading: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Ошибка смены роли',
        isLoading: false,
      })
    }
  },
}))
