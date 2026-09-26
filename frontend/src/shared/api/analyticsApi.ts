import { isReal } from '@/shared/api/apiCapabilities'
import { analyticsReal, createApiProxy } from '@/shared/api/real/moderationAdmin'
import { delay } from '@/shared/lib/delay'
import {
  getAnalyticsByPeriod,
  mockAnalyticsTable,
  type AnalyticsMetricRow,
  type AnalyticsOverview,
  type AnalyticsPeriod,
  type FunnelStep,
  type GrowthMetrics,
  type ModerationAnalytics,
} from '@/shared/mocks/analytics'

const mockAnalyticsApi = {
  async getOverview(period: AnalyticsPeriod = '30d'): Promise<AnalyticsOverview> {
    await delay(200 + Math.floor(Math.random() * 400))
    return getAnalyticsByPeriod(period)
  },

  async getFunnel(period: AnalyticsPeriod = '30d'): Promise<FunnelStep[]> {
    await delay(200 + Math.floor(Math.random() * 300))
    return getAnalyticsByPeriod(period).funnel.map((s) => ({ ...s }))
  },

  async getGrowth(period: AnalyticsPeriod = '30d'): Promise<GrowthMetrics> {
    await delay(200 + Math.floor(Math.random() * 300))
    return structuredClone(getAnalyticsByPeriod(period).growth)
  },

  async getModerationStats(period: AnalyticsPeriod = '30d'): Promise<ModerationAnalytics> {
    await delay(200 + Math.floor(Math.random() * 300))
    return structuredClone(getAnalyticsByPeriod(period).moderation)
  },

  async getMetricsTable(): Promise<AnalyticsMetricRow[]> {
    await delay(200 + Math.floor(Math.random() * 200))
    return mockAnalyticsTable.map((r) => ({ ...r }))
  },
}

export const analyticsApi = createApiProxy(analyticsReal, mockAnalyticsApi, () =>
  isReal('analytics'),
)

export type { AnalyticsPeriod, FunnelStep }
