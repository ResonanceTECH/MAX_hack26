import { describe, expect, it } from 'vitest'
import { REPORT_TYPE } from '@/entities/report'
import { reportsApi } from '@/shared/api/reportsApi'

describe('reportsApi.create (mock)', () => {
  it('creates a report', async () => {
    const report = await reportsApi.create({
      targetType: 'company',
      targetId: `company-report-test-${Date.now()}`,
      targetName: 'Test Co',
      type: REPORT_TYPE.SPAM,
      description: 'test',
    })
    expect(report.id).toBeTruthy()
    expect(report.status).toBe('OPEN')
  })
})
