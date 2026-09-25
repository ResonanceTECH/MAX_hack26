import type { CompanySettings } from '@/entities/company-settings'
import { CURRENT_COMPANY_ID } from './user'

export const mockCompanySettings: CompanySettings = {
  companyId: CURRENT_COMPANY_ID,
  notifications: {
    newProposals: true,
    matchingOrders: true,
    proposalStatusChanges: true,
    shortlist: true,
    negotiations: true,
    deadlineReminders: true,
    companyManagementEvents: true,
  },
  visibility: {
    publicProfile: true,
    showServices: true,
    showPrices: false,
    showCases: true,
    showDocuments: false,
  },
  matching: {
    receiveOrderRecommendations: true,
    showInCustomerRecommendations: true,
    useCasesInMatching: true,
    useDocumentsInMatching: true,
  },
  archived: false,
}

export function resetMockCompanySettings(next: CompanySettings): void {
  Object.assign(mockCompanySettings, structuredClone(next))
}
