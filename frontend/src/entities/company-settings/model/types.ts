export interface CompanyNotificationSettings {
  newProposals: boolean
  matchingOrders: boolean
  proposalStatusChanges: boolean
  shortlist: boolean
  negotiations: boolean
  deadlineReminders: boolean
  companyManagementEvents: boolean
}

export interface CompanyVisibilitySettings {
  publicProfile: boolean
  showServices: boolean
  showPrices: boolean
  showCases: boolean
  showDocuments: boolean
}

export interface CompanyMatchingSettings {
  receiveOrderRecommendations: boolean
  showInCustomerRecommendations: boolean
  useCasesInMatching: boolean
  useDocumentsInMatching: boolean
}

export interface CompanySettings {
  companyId: string
  notifications: CompanyNotificationSettings
  visibility: CompanyVisibilitySettings
  matching: CompanyMatchingSettings
  archived: boolean
}
