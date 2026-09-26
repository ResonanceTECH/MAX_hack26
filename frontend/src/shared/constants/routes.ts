export const ROUTES = {
  HOME: '/',
  ACCESS_DENIED: '/access-denied',
  PROFILE: '/profile',

  OPPORTUNITIES: '/opportunities',
  OPPORTUNITY_DETAILS: '/opportunities/:id',
  OPPORTUNITY_CREATE: '/opportunities/create',
  OPPORTUNITY_PROPOSALS: '/opportunities/:id/proposals',
  OPPORTUNITY_COMPARE: '/opportunities/:id/compare',
  OPPORTUNITY_PROPOSE: '/opportunities/:id/propose',
  PROPOSAL_CREATE: '/proposals/create/:opportunityId',

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
  NOTIFICATIONS: '/notifications',

  PROFILE_COMPANY: '/profile/company',
  PROFILE_COMPANY_EDIT: '/profile/company/edit',
  PROFILE_COMPANY_TEAM: '/profile/company/team',
  PROFILE_COMPANY_TEAM_INVITE: '/profile/company/team/invite',
  PROFILE_COMPANY_TEAM_MEMBER: '/profile/company/team/:memberId',
  PROFILE_COMPANY_SERVICES: '/profile/company/services',
  PROFILE_COMPANY_SERVICES_CREATE: '/profile/company/services/create',
  PROFILE_COMPANY_SERVICE_DETAIL: '/profile/company/services/:serviceId',
  PROFILE_COMPANY_SERVICE_EDIT: '/profile/company/services/:serviceId/edit',
  PROFILE_COMPANY_CASES: '/profile/company/cases',
  PROFILE_COMPANY_CASES_CREATE: '/profile/company/cases/create',
  PROFILE_COMPANY_CASE_DETAIL: '/profile/company/cases/:caseId',
  PROFILE_COMPANY_CASE_EDIT: '/profile/company/cases/:caseId/edit',
  PROFILE_COMPANY_DOCUMENTS: '/profile/company/documents',
  PROFILE_COMPANY_DOCUMENTS_UPLOAD: '/profile/company/documents/upload',
  PROFILE_COMPANY_DOCUMENT_DETAIL: '/profile/company/documents/:documentId',
  PROFILE_COMPANY_PERMISSIONS: '/profile/company/permissions',
  PROFILE_COMPANY_SETTINGS: '/profile/company/settings',
  PROFILE_COMPANY_VERIFICATION: '/profile/company/verification',
  PROFILE_COMPANY_ACTIVITY: '/profile/company/activity',

  /** Aliases used by company-admin pages */
  COMPANY_ADMIN: '/profile/company',
  COMPANY_EDIT: '/profile/company/edit',
  COMPANY_TEAM: '/profile/company/team',
  COMPANY_TEAM_INVITE: '/profile/company/team/invite',
  COMPANY_TEAM_MEMBER: '/profile/company/team/:memberId',
  COMPANY_SERVICES: '/profile/company/services',
  COMPANY_SERVICES_CREATE: '/profile/company/services/create',
  COMPANY_SERVICE_DETAIL: '/profile/company/services/:serviceId',
  COMPANY_SERVICE_EDIT: '/profile/company/services/:serviceId/edit',
  COMPANY_CASES: '/profile/company/cases',
  COMPANY_CASES_CREATE: '/profile/company/cases/create',
  COMPANY_CASE_DETAIL: '/profile/company/cases/:caseId',
  COMPANY_CASE_EDIT: '/profile/company/cases/:caseId/edit',
  COMPANY_DOCUMENTS: '/profile/company/documents',
  COMPANY_DOCUMENTS_UPLOAD: '/profile/company/documents/upload',
  COMPANY_DOCUMENT_DETAIL: '/profile/company/documents/:documentId',
  COMPANY_PERMISSIONS: '/profile/company/permissions',
  COMPANY_SETTINGS: '/profile/company/settings',
  COMPANY_VERIFICATION: '/profile/company/verification',
  COMPANY_ACTIVITY: '/profile/company/activity',

  COMPANY_INVITATION: '/company-invitations/:token',

  MODERATION: '/moderation',
  MODERATION_QUEUE: '/moderation/queue',
  MODERATION_QUEUE_COMPANIES: '/moderation/queue/companies',
  MODERATION_QUEUE_OPPORTUNITIES: '/moderation/queue/opportunities',
  MODERATION_QUEUE_CASES: '/moderation/queue/cases',
  MODERATION_QUEUE_DOCUMENTS: '/moderation/queue/documents',
  MODERATION_COMPANY: '/moderation/company/:id',
  MODERATION_OPPORTUNITY: '/moderation/opportunity/:id',
  MODERATION_CASE: '/moderation/case/:id',
  MODERATION_DOCUMENT: '/moderation/document/:id',
  MODERATION_REPORTS: '/moderation/reports',
  MODERATION_REPORT: '/moderation/reports/:id',
  MODERATION_ESCALATIONS: '/moderation/escalations',
  MODERATION_HISTORY: '/moderation/history',
  MODERATION_PROFILE: '/moderation/profile',
  MODERATION_DETAIL: '/moderation/:type/:id',
  MODERATION_ITEM: '/moderation/:type/:id',

  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER: '/admin/users/:id',
  ADMIN_USER_DETAIL: '/admin/users/:id',
  ADMIN_COMPANIES: '/admin/companies',
  ADMIN_COMPANY: '/admin/companies/:id',
  ADMIN_COMPANY_DETAIL: '/admin/companies/:id',
  ADMIN_MODERATION: '/admin/moderation',
  ADMIN_MODERATION_ITEM: '/admin/moderation/:type/:id',
  ADMIN_DICTIONARIES: '/admin/dictionaries',
  ADMIN_DICTIONARIES_CATEGORIES: '/admin/dictionaries/categories',
  ADMIN_DICTIONARIES_INDUSTRIES: '/admin/dictionaries/industries',
  ADMIN_DICTIONARIES_SKILLS: '/admin/dictionaries/skills',
  ADMIN_DICTIONARIES_TECHNOLOGIES: '/admin/dictionaries/technologies',
  ADMIN_DICTIONARIES_REGIONS: '/admin/dictionaries/regions',
  ADMIN_DICTIONARIES_DOCUMENT_TYPES: '/admin/dictionaries/document-types',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_FEATURE_FLAGS: '/admin/feature-flags',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_PROFILE: '/admin/profile',
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

export function proposalCreatePath(opportunityId: string): string {
  return `/proposals/create/${opportunityId}`
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

export function moderationDetailPath(type: string, id: string): string {
  return `/moderation/${type}/${id}`
}

/** Prefer type+id; single-id form resolves via queue lookup route alias */
export function moderationItemPath(idOrType: string, id?: string): string {
  if (id) return `/moderation/${idOrType}/${id}`
  return `/moderation/item/${idOrType}`
}

export function moderationReportPath(id: string): string {
  return `/moderation/reports/${id}`
}

export function queueTypePath(type: string): string {
  if (type === 'all') return '/moderation/queue'
  return `/moderation/queue/${type === 'opportunity' ? 'opportunities' : type === 'company' ? 'companies' : type === 'case' ? 'cases' : 'documents'}`
}

export function adminUserPath(id: string): string {
  return `/admin/users/${id}`
}

export function adminCompanyPath(id: string): string {
  return `/admin/companies/${id}`
}

export function adminModerationItemPath(type: string, id: string): string {
  return `/admin/moderation/${type}/${id}`
}

export function adminDictionaryPath(type: string): string {
  return `/admin/dictionaries/${type}`
}

export function companyTeamMemberPath(memberId: string): string {
  return `/profile/company/team/${memberId}`
}

export function companyServicePath(serviceId: string): string {
  return `/profile/company/services/${serviceId}`
}

export function companyServiceEditPath(serviceId: string): string {
  return `/profile/company/services/${serviceId}/edit`
}

export function companyCasePath(caseId: string): string {
  return `/profile/company/cases/${caseId}`
}

export function companyCaseEditPath(caseId: string): string {
  return `/profile/company/cases/${caseId}/edit`
}

export function companyDocumentPath(documentId: string): string {
  return `/profile/company/documents/${documentId}`
}

export function companyInvitationPath(token: string): string {
  return `/company-invitations/${token}`
}
