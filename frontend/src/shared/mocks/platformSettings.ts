export interface PlatformSettings {
  general: {
    productName: string
    supportContact: string
    defaultLocale: string
    statusMessage: string
  }
  moderation: {
    autoQueueNewCompanies: boolean
    requireReasonOnReject: boolean
    notifyOnDecision: boolean
    newCompaniesRequireModeration: boolean
    newDocumentsRequireModeration: boolean
    reportedOpportunitiesAutoEnter: boolean
  }
  matching: {
    minScoreToShow: number
    maxRecommendationsPerRequest: number
    matchExplanationEnabled: boolean
    boostVerifiedCompanies: boolean
  }
  notifications: {
    emailDigest: boolean
    pushEnabled: boolean
    matchNotifications: boolean
    proposalNotifications: boolean
    moderationNotifications: boolean
    deadlineReminders: boolean
    systemNotifications: boolean
  }
  maintenance: {
    enabled: boolean
    message: string
  }
  announcement: {
    text: string
    startDate: string | null
    endDate: string | null
    status: 'draft' | 'active' | 'expired'
  }
}

export const mockPlatformSettings: PlatformSettings = {
  general: {
    productName: 'B2B Match',
    supportContact: 'support@b2b-match.example',
    defaultLocale: 'ru-RU',
    statusMessage: 'Платформа работает в штатном режиме',
  },
  moderation: {
    autoQueueNewCompanies: true,
    requireReasonOnReject: true,
    notifyOnDecision: true,
    newCompaniesRequireModeration: true,
    newDocumentsRequireModeration: true,
    reportedOpportunitiesAutoEnter: true,
  },
  matching: {
    minScoreToShow: 70,
    maxRecommendationsPerRequest: 20,
    matchExplanationEnabled: true,
    boostVerifiedCompanies: true,
  },
  notifications: {
    emailDigest: false,
    pushEnabled: true,
    matchNotifications: true,
    proposalNotifications: true,
    moderationNotifications: true,
    deadlineReminders: true,
    systemNotifications: true,
  },
  maintenance: {
    enabled: false,
    message: 'Платформа временно недоступна. Ведутся технические работы.',
  },
  announcement: {
    text: '',
    startDate: null,
    endDate: null,
    status: 'draft',
  },
}

export const mockPlatformHealth = {
  miniApp: 'Работает' as const,
  mockApi: 'Работает' as const,
  notifications: 'Работают' as const,
  matching: 'Работает' as const,
  maintenance: 'Выключен' as const,
  label: 'Demo / Model data' as const,
}
