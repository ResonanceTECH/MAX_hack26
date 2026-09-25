import type { Company } from '@/entities/company'
import type { User } from '@/entities/user'
import type { SystemRole } from '@/entities/user'
import { delay } from '@/shared/lib/delay'
import { getCompanyById, getMockUserByRole, mockCurrentUser } from '@/shared/mocks'

export interface SessionPayload {
  user: User
  company: Company | null
  role: SystemRole
}

export const authApi = {
  async getCurrentUser(role?: SystemRole): Promise<User> {
    await delay()
    return role ? getMockUserByRole(role) : { ...mockCurrentUser }
  },

  async getSession(role?: SystemRole): Promise<SessionPayload> {
    await delay()
    const user = role ? getMockUserByRole(role) : { ...mockCurrentUser }
    const company = user.companyId ? (getCompanyById(user.companyId) ?? null) : null
    return { user, company, role: user.role }
  },
}
