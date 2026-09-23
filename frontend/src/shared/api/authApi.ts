import type { User } from '@/entities/user'
import { delay } from '@/shared/lib/delay'
import { mockCurrentUser } from '@/shared/mocks'

export const authApi = {
  async getCurrentUser(): Promise<User> {
    await delay()
    return mockCurrentUser
  },
}
