export interface PlatformSettings {
  moderation: {
    autoQueueNewCompanies: boolean
    requireReasonOnReject: boolean
    notifyOnDecision: boolean
  }
  matching: {
    minScoreToShow: number
    boostVerifiedCompanies: boolean
  }
  notifications: {
    emailDigest: boolean
    pushEnabled: boolean
  }
  maintenance: {
    enabled: boolean
    message: string
  }
}

export const mockPlatformSettings: PlatformSettings = {
  moderation: {
    autoQueueNewCompanies: true,
    requireReasonOnReject: true,
    notifyOnDecision: true,
  },
  matching: {
    minScoreToShow: 40,
    boostVerifiedCompanies: true,
  },
  notifications: {
    emailDigest: false,
    pushEnabled: true,
  },
  maintenance: {
    enabled: false,
    message: 'Платформа временно недоступна. Ведутся технические работы.',
  },
}
