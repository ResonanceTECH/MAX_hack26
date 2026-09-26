import { useMemo } from 'react'
import {
  COMPANY_MEMBER_STATUS,
  type CompanyMember,
  type CompanyMemberRole,
} from '@/entities/company-member'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useCompanyMembers } from '@/features/company-management/api/queries'

export interface CompanyMembershipState {
  membership: CompanyMember | null
  companyRole: CompanyMemberRole | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * Current user's CompanyMember for the active session company.
 * Prefers a live members-list match; falls back to session.companyMemberRole (demo switcher).
 */
export function useCompanyMembership(): CompanyMembershipState {
  const user = useSessionStore((s) => s.user)
  const company = useSessionStore((s) => s.company)
  const sessionCompanyRole = useSessionStore((s) => s.companyMemberRole)
  const membersQ = useCompanyMembers(company?.id)

  const membership = useMemo((): CompanyMember | null => {
    if (!user || !company) return null

    const fromList = (membersQ.data ?? []).find(
      (m) =>
        m.userId === user.id &&
        m.companyId === company.id &&
        m.status === COMPANY_MEMBER_STATUS.ACTIVE,
    )
    if (fromList) return fromList

    if (sessionCompanyRole) {
      return {
        id: `session-member-${user.id}`,
        userId: user.id,
        companyId: company.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: `${user.id}@demo.local`,
        role: sessionCompanyRole,
        status: COMPANY_MEMBER_STATUS.ACTIVE,
        invitedAt: user.createdAt,
        joinedAt: user.createdAt,
      }
    }

    return null
  }, [user, company, membersQ.data, sessionCompanyRole])

  return {
    membership,
    companyRole: membership?.role ?? sessionCompanyRole ?? null,
    isLoading: Boolean(company?.id) && membersQ.isLoading,
    isError: membersQ.isError,
    refetch: () => {
      void membersQ.refetch()
    },
  }
}
