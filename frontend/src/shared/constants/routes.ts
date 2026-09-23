export const ROUTES = {
  HOME: '/',
  OPPORTUNITIES: '/opportunities',
  OPPORTUNITY_DETAILS: '/opportunities/:id',
  OPPORTUNITY_CREATE: '/opportunities/create',
  OPPORTUNITY_PROPOSALS: '/opportunities/:id/proposals',
  OPPORTUNITY_COMPARE: '/opportunities/:id/compare',
  OPPORTUNITY_PROPOSE: '/opportunities/:id/propose',
  COMPANIES: '/companies',
  COMPANY_DETAILS: '/companies/:id',
  MY: '/my',
  MY_REQUESTS: '/my/requests',
  MY_PROPOSALS: '/my/proposals',
  MY_SHORTLIST: '/my/shortlist',
  MY_NEGOTIATIONS: '/my/negotiations',
  PROPOSAL_DETAILS: '/proposals/:id',
  DEAL_DETAILS: '/deals/:id',
  FAVORITES: '/favorites',
  PROFILE_COMPANY: '/profile/company',
  NOTIFICATIONS: '/notifications',
} as const

export function opportunityDetailsPath(id: string): string {
  return `/opportunities/${id}`
}

export function opportunityProposalsPath(id: string): string {
  return `/opportunities/${id}/proposals`
}

export function opportunityComparePath(id: string): string {
  return `/opportunities/${id}/compare`
}

export function opportunityProposePath(id: string): string {
  return `/opportunities/${id}/propose`
}

export function companyDetailsPath(id: string): string {
  return `/companies/${id}`
}

export function proposalDetailsPath(id: string): string {
  return `/proposals/${id}`
}

export function dealDetailsPath(id: string): string {
  return `/deals/${id}`
}
