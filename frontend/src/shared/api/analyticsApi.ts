import { delay } from '@/shared/lib/delay'
import {
  mockAnalyticsOverview,
  mockAnalyticsTable,
  mockFunnel,
  type AnalyticsMetricRow,
  type AnalyticsOverview,
  type FunnelStep,
} from '@/shared/mocks/analytics'

export const analyticsApi = {
  async getOverview(): Promise<AnalyticsOverview> {
    await delay()
    return { ...mockAnalyticsOverview }
  },

  async getFunnel(): Promise<FunnelStep[]> {
    await delay()
    return mockFunnel.map((s) => ({ ...s }))
  },

  async getMetricsTable(): Promise<AnalyticsMetricRow[]> {
    await delay()
    return mockAnalyticsTable.map((r) => ({ ...r }))
  },
}
