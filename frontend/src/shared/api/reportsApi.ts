import type { Report } from '@/entities/report'
import { delay } from '@/shared/lib/delay'
import { getReportById, mockReports } from '@/shared/mocks/reports'

export interface ReportListFilters {
  status?: Report['status'] | 'all'
  query?: string
}

export const reportsApi = {
  async list(filters?: ReportListFilters): Promise<Report[]> {
    await delay()
    let items = [...mockReports]
    if (filters?.status && filters.status !== 'all') {
      items = items.filter((r) => r.status === filters.status)
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase()
      items = items.filter((r) =>
        `${r.targetName} ${r.reporterName} ${r.description} ${r.reason}`.toLowerCase().includes(q),
      )
    }
    return items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  },

  async getById(id: string): Promise<Report> {
    await delay()
    const report = getReportById(id)
    if (!report) throw new Error('Жалоба не найдена')
    return { ...report }
  },

  async close(id: string): Promise<Report> {
    await delay()
    const report = getReportById(id)
    if (!report) throw new Error('Жалоба не найдена')
    report.status = 'closed'
    return { ...report }
  },

  async applyAction(id: string, note?: string): Promise<Report> {
    await delay()
    const report = getReportById(id)
    if (!report) throw new Error('Жалоба не найдена')
    report.status = 'action_taken'
    if (note?.trim()) {
      report.description = `${report.description}\n\nДействие модератора: ${note.trim()}`
    }
    return { ...report }
  },
}
