import { create } from 'zustand'
import type { User } from '@/entities/user'
import type { Company } from '@/entities/company'
import { authApi } from '@/shared/api/authApi'
import { companyApi } from '@/shared/api/companyApi'

interface SessionState {
  user: User | null
  company: Company | null
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  initSession: () => Promise<void>
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  company: null,
  isInitialized: false,
  isLoading: false,
  error: null,
  initSession: async () => {
    set({ isLoading: true, error: null })
    try {
      const user = await authApi.getCurrentUser()
      const company = await companyApi.getById(user.companyId)
      set({ user, company, isInitialized: true, isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Ошибка инициализации',
        isLoading: false,
        isInitialized: true,
      })
    }
  },
}))
