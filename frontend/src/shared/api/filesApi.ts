import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'
import { delay } from '@/shared/lib/delay'
import { persistDeals } from '@/shared/mocks/hydrateMocks'
import { getDealById } from '@/shared/mocks'

export interface UploadedFileMeta {
  id: string
  name: string
  contentType?: string | null
  size: number
  url: string
  opportunityId?: string | null
  dealId?: string | null
  createdAt: string
}

interface FileDto {
  id: number
  name: string
  content_type?: string | null
  size: number
  opportunity_id?: number | null
  deal_id?: number | null
  created_at: string
}

function mapFile(dto: FileDto): UploadedFileMeta {
  return {
    id: String(dto.id),
    name: dto.name,
    contentType: dto.content_type,
    size: dto.size,
    url: `/files/${dto.id}`,
    opportunityId: dto.opportunity_id != null ? String(dto.opportunity_id) : null,
    dealId: dto.deal_id != null ? String(dto.deal_id) : null,
    createdAt: dto.created_at,
  }
}

export interface UploadFileParams {
  file: File
  opportunityId?: string
  dealId?: string
  onProgress?: (percent: number) => void
}

const MAX_BYTES = 10 * 1024 * 1024

export const filesApi = {
  maxBytes: MAX_BYTES,

  async upload(params: UploadFileParams): Promise<UploadedFileMeta> {
    if (params.file.size > MAX_BYTES) {
      throw new Error('Файл больше 10 МБ')
    }

    if (isReal('documents')) {
      try {
        const form = new FormData()
        form.append('file', params.file)
        if (params.opportunityId) form.append('opportunity_id', params.opportunityId)
        if (params.dealId) form.append('deal_id', params.dealId)

        const { data } = await apiClient.post<FileDto>('/files', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (event) => {
            if (!params.onProgress || !event.total) return
            params.onProgress(Math.round((event.loaded / event.total) * 100))
          },
        })
        return mapFile(data)
      } catch (error) {
        throw toApiError(error)
      }
    }

    await delay(400)
    params.onProgress?.(100)
    const meta: UploadedFileMeta = {
      id: `file-${Date.now()}`,
      name: params.file.name,
      contentType: params.file.type,
      size: params.file.size,
      url: `mock://${params.file.name}`,
      opportunityId: params.opportunityId ?? null,
      dealId: params.dealId ?? null,
      createdAt: new Date().toISOString(),
    }
    if (params.dealId) {
      const deal = getDealById(params.dealId)
      if (deal) {
        deal.files = [
          ...(deal.files ?? []),
          {
            id: meta.id,
            name: meta.name,
            contentType: meta.contentType ?? null,
            size: meta.size,
            createdAt: meta.createdAt,
          },
        ]
        deal.updatedAt = meta.createdAt
        persistDeals()
      }
    }
    return meta
  },
}
