export interface PlatformMetrics {
  users: number
  companies: number
  activeOpportunities: number
  proposals: number
  matches: number
  negotiations: number
  pendingModeration: number
  reports: number
}

export interface FunnelStep {
  label: string
  value: number
  rate?: number
}

export interface AnalyticsMetricRow {
  label: string
  value: number
  delta?: string
}

export interface AnalyticsOverview {
  usersTotal: number
  companiesTotal: number
  opportunitiesOpen: number
  dealsActive: number
  matchesThisMonth: number
  moderationPending: number
  metrics: PlatformMetrics
  funnel: FunnelStep[]
  createdOpportunities: number
  publishedOpportunities: number
  createdProposals: number
  shortlists: number
  negotiations: number
}

export const mockFunnel: FunnelStep[] = [
  { label: 'Opportunity', value: 120, rate: 100 },
  { label: 'Proposal', value: 78, rate: 65 },
  { label: 'Shortlist', value: 41, rate: 34 },
  { label: 'Negotiation', value: 22, rate: 18 },
]

export const mockAnalyticsTable: AnalyticsMetricRow[] = [
  { label: 'Созданные запросы', value: 156, delta: '+12%' },
  { label: 'Опубликованные запросы', value: 120, delta: '+8%' },
  { label: 'Созданные proposals', value: 241, delta: '+15%' },
  { label: 'Matches', value: 190, delta: '+9%' },
  { label: 'Shortlists', value: 64, delta: '+5%' },
  { label: 'Negotiations', value: 47, delta: '+3%' },
]

export const mockAnalyticsOverview: AnalyticsOverview = {
  usersTotal: 1284,
  companiesTotal: 312,
  opportunitiesOpen: 86,
  dealsActive: 47,
  matchesThisMonth: 190,
  moderationPending: 28,
  metrics: {
    users: 1284,
    companies: 312,
    activeOpportunities: 86,
    proposals: 241,
    matches: 190,
    negotiations: 47,
    pendingModeration: 28,
    reports: 6,
  },
  funnel: mockFunnel,
  createdOpportunities: 156,
  publishedOpportunities: 120,
  createdProposals: 241,
  shortlists: 64,
  negotiations: 47,
}

export const mockAnalytics = mockAnalyticsOverview
