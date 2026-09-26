export type AnalyticsPeriod = '7d' | '30d' | '90d'

export interface PeriodDelta {
  value: number
  previousPeriod: number
  changePercent: number
}

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

export interface GrowthMetrics {
  newUsers: PeriodDelta
  newCompanies: PeriodDelta
  newOpportunities: PeriodDelta
}

export interface MatchQualityMetrics {
  averageMatchScore: number
  matchViewedRate: number
  matchToProposalRate: number
  negativeMatchFeedback: number
}

export interface ModerationAnalytics {
  pendingItems: number
  averageQueueAgeHours: number
  approved: number
  rejected: number
  needsChanges: number
  reports: number
  escalations: number
}

export interface ConversionMetrics {
  matchToProposal: number
  proposalToShortlist: number
  shortlistToNegotiation: number
}

export interface AnalyticsOverview {
  period: AnalyticsPeriod
  usersTotal: number
  companiesTotal: number
  opportunitiesOpen: number
  dealsActive: number
  matchesThisMonth: number
  moderationPending: number
  openReports: number
  users: PeriodDelta
  companies: PeriodDelta
  activeRequests: PeriodDelta
  proposals: PeriodDelta
  negotiations: PeriodDelta
  pendingModeration: PeriodDelta
  openReportsDelta: PeriodDelta
  metrics: PlatformMetrics
  funnel: FunnelStep[]
  conversions: ConversionMetrics
  growth: GrowthMetrics
  matchQuality: MatchQualityMetrics
  moderation: ModerationAnalytics
  createdOpportunities: number
  publishedOpportunities: number
  createdProposals: number
  shortlists: number
  negotiationsCount: number
  isModelData: boolean
}

function delta(value: number, previousPeriod: number): PeriodDelta {
  const changePercent =
    previousPeriod === 0 ? 0 : Math.round(((value - previousPeriod) / previousPeriod) * 1000) / 10
  return { value, previousPeriod, changePercent }
}

const PERIOD_DATA: Record<AnalyticsPeriod, AnalyticsOverview> = {
  '7d': {
    period: '7d',
    usersTotal: 12480,
    companiesTotal: 4260,
    opportunitiesOpen: 1382,
    dealsActive: 738,
    matchesThisMonth: 8500,
    moderationPending: 42,
    openReports: 12,
    users: delta(12480, 11555),
    companies: delta(4260, 4100),
    activeRequests: delta(1382, 1290),
    proposals: delta(5412, 5100),
    negotiations: delta(738, 700),
    pendingModeration: delta(42, 48),
    openReportsDelta: delta(12, 12.4),
    metrics: {
      users: 12480,
      companies: 4260,
      activeOpportunities: 1382,
      proposals: 5412,
      matches: 8500,
      negotiations: 738,
      pendingModeration: 42,
      reports: 12,
    },
    funnel: [
      { label: 'Opportunity', value: 1000, rate: 100 },
      { label: 'Match', value: 8500, rate: 850 },
      { label: 'Proposal', value: 3100, rate: 36.5 },
      { label: 'Shortlist', value: 1200, rate: 38.7 },
      { label: 'Negotiation', value: 620, rate: 51.7 },
    ],
    conversions: {
      matchToProposal: 36.5,
      proposalToShortlist: 38.7,
      shortlistToNegotiation: 51.7,
    },
    growth: {
      newUsers: delta(180, 165),
      newCompanies: delta(42, 38),
      newOpportunities: delta(210, 198),
    },
    matchQuality: {
      averageMatchScore: 74,
      matchViewedRate: 62,
      matchToProposalRate: 36.5,
      negativeMatchFeedback: 4.2,
    },
    moderation: {
      pendingItems: 42,
      averageQueueAgeHours: 18,
      approved: 86,
      rejected: 14,
      needsChanges: 22,
      reports: 12,
      escalations: 5,
    },
    createdOpportunities: 210,
    publishedOpportunities: 180,
    createdProposals: 640,
    shortlists: 210,
    negotiationsCount: 95,
    isModelData: true,
  },
  '30d': {
    period: '30d',
    usersTotal: 12480,
    companiesTotal: 4260,
    opportunitiesOpen: 1382,
    dealsActive: 738,
    matchesThisMonth: 8500,
    moderationPending: 42,
    openReports: 12,
    users: delta(12480, 11800),
    companies: delta(4260, 3980),
    activeRequests: delta(1382, 1210),
    proposals: delta(5412, 4800),
    negotiations: delta(738, 650),
    pendingModeration: delta(42, 55),
    openReportsDelta: delta(12, 15),
    metrics: {
      users: 12480,
      companies: 4260,
      activeOpportunities: 1382,
      proposals: 5412,
      matches: 8500,
      negotiations: 738,
      pendingModeration: 42,
      reports: 12,
    },
    funnel: [
      { label: 'Opportunity', value: 1000, rate: 100 },
      { label: 'Match', value: 8500, rate: 850 },
      { label: 'Proposal', value: 3100, rate: 36.5 },
      { label: 'Shortlist', value: 1200, rate: 38.7 },
      { label: 'Negotiation', value: 620, rate: 51.7 },
    ],
    conversions: {
      matchToProposal: 36.5,
      proposalToShortlist: 38.7,
      shortlistToNegotiation: 51.7,
    },
    growth: {
      newUsers: delta(680, 610),
      newCompanies: delta(160, 145),
      newOpportunities: delta(820, 760),
    },
    matchQuality: {
      averageMatchScore: 73,
      matchViewedRate: 60,
      matchToProposalRate: 35.2,
      negativeMatchFeedback: 4.8,
    },
    moderation: {
      pendingItems: 42,
      averageQueueAgeHours: 22,
      approved: 320,
      rejected: 58,
      needsChanges: 90,
      reports: 48,
      escalations: 18,
    },
    createdOpportunities: 820,
    publishedOpportunities: 700,
    createdProposals: 2410,
    shortlists: 820,
    negotiationsCount: 380,
    isModelData: true,
  },
  '90d': {
    period: '90d',
    usersTotal: 12480,
    companiesTotal: 4260,
    opportunitiesOpen: 1382,
    dealsActive: 738,
    matchesThisMonth: 8500,
    moderationPending: 42,
    openReports: 12,
    users: delta(12480, 10200),
    companies: delta(4260, 3510),
    activeRequests: delta(1382, 980),
    proposals: delta(5412, 3900),
    negotiations: delta(738, 520),
    pendingModeration: delta(42, 60),
    openReportsDelta: delta(12, 20),
    metrics: {
      users: 12480,
      companies: 4260,
      activeOpportunities: 1382,
      proposals: 5412,
      matches: 8500,
      negotiations: 738,
      pendingModeration: 42,
      reports: 12,
    },
    funnel: [
      { label: 'Opportunity', value: 1000, rate: 100 },
      { label: 'Match', value: 8500, rate: 850 },
      { label: 'Proposal', value: 3100, rate: 36.5 },
      { label: 'Shortlist', value: 1200, rate: 38.7 },
      { label: 'Negotiation', value: 620, rate: 51.7 },
    ],
    conversions: {
      matchToProposal: 36.5,
      proposalToShortlist: 38.7,
      shortlistToNegotiation: 51.7,
    },
    growth: {
      newUsers: delta(2100, 1800),
      newCompanies: delta(520, 440),
      newOpportunities: delta(2400, 2100),
    },
    matchQuality: {
      averageMatchScore: 72,
      matchViewedRate: 58,
      matchToProposalRate: 34.1,
      negativeMatchFeedback: 5.1,
    },
    moderation: {
      pendingItems: 42,
      averageQueueAgeHours: 26,
      approved: 980,
      rejected: 180,
      needsChanges: 260,
      reports: 140,
      escalations: 52,
    },
    createdOpportunities: 2400,
    publishedOpportunities: 2100,
    createdProposals: 7200,
    shortlists: 2400,
    negotiationsCount: 1100,
    isModelData: true,
  },
}

export const mockFunnel: FunnelStep[] = PERIOD_DATA['30d'].funnel

export const mockAnalyticsTable: AnalyticsMetricRow[] = [
  { label: 'Созданные запросы', value: 820, delta: '+8%' },
  { label: 'Опубликованные запросы', value: 700, delta: '+6%' },
  { label: 'Созданные proposals', value: 2410, delta: '+12%' },
  { label: 'Matches', value: 8500, delta: '+9%' },
  { label: 'Shortlists', value: 820, delta: '+5%' },
  { label: 'Negotiations', value: 380, delta: '+7%' },
]

export const mockAnalyticsOverview: AnalyticsOverview = PERIOD_DATA['30d']

export const mockAnalytics = mockAnalyticsOverview

export function getAnalyticsByPeriod(period: AnalyticsPeriod = '30d'): AnalyticsOverview {
  return structuredClone(PERIOD_DATA[period] ?? PERIOD_DATA['30d'])
}
