export { mockCompanies, getCompanyById } from './companies'
export { mockOpportunities, getOpportunityById } from './opportunities'
export { mockProposals, getProposalById, getProposalsByOpportunity } from './proposals'
export { mockMatches, getMatchesByOpportunity, getMatchForCompany } from './matches'
export { mockNotifications } from './notifications'
export {
  mockCurrentUser,
  mockUsers,
  CURRENT_COMPANY_ID,
  getMockUserByRole,
  getHomePathForRole,
} from './user'
export { mockShortlist, type ShortlistItem } from './shortlist'
export { mockDeals, getDealById } from './deals'
export {
  mockFavorites,
  isFavorite,
  toggleFavorite,
  type FavoriteItem,
} from './favorites'
export { mockCompanyMembers } from './companyMembers'
export { mockCompanyServices } from './companyServices'
export { mockCompanyCases } from './companyCases'
export { mockCompanyDocuments } from './companyDocuments'
export { mockCompanyActivity } from './companyActivity'
export { mockCompanySettings } from './companySettings'
export {
  mockCompanyVerification,
  type CompanyVerification,
  type CompanyVerificationBlock,
} from './companyVerification'
export {
  mockModerationItems,
  getModerationItemById,
  getModerationItemByEntity,
} from './moderation'
export { mockReports, getReportById } from './reports'
export { mockModerationHistory, mockOwnerNotifications } from './moderationHistory'
export { mockEscalations, getEscalationById } from './escalations'
export { mockModeratorNotifications } from './moderatorNotifications'
export { mockAuditEvents, appendAudit, type AuditEvent } from './audit'
export {
  mockDictionaries,
  getDictionaryItemById,
  type DictionaryItem,
  type DictionaryType,
  type DictionaryStatus,
} from './dictionaries'
export {
  mockAnalytics,
  mockAnalyticsOverview,
  mockFunnel,
  mockAnalyticsTable,
  type AnalyticsOverview,
  type FunnelStep,
  type PlatformMetrics,
} from './analytics'
export { mockPlatformSettings, type PlatformSettings } from './platformSettings'
export { mockAdminUsers, getAdminUserById, type AdminUser } from './adminUsers'
