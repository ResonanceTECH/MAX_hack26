import type { User } from '@/entities/user'
import { USER_ROLES } from '@/entities/user'

/** Mock current user for local browser development outside MAX */
export const mockCurrentUser: User = {
  id: 'user-anna',
  maxUserId: 'max-10001',
  firstName: 'Анна',
  lastName: 'Смирнова',
  avatarUrl: null,
  companyId: 'company-digital-lab',
  role: USER_ROLES.COMPANY_OWNER,
}

export const CURRENT_COMPANY_ID = 'company-digital-lab'
