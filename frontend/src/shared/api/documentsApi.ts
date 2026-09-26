import { COMPANY_ACTIVITY_TYPE } from '@/entities/company-activity'
import {
  COMPANY_DOCUMENT_STATUS,
  COMPANY_DOCUMENT_VERIFICATION_SOURCE,
  type CompanyDocument,
  type CompanyDocumentVerificationSource,
} from '@/entities/company-document'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'
import { delay } from '@/shared/lib/delay'
import { mockCompanyDocuments } from '@/shared/mocks'
import { persistCompanyDocuments } from '@/shared/mocks/hydrateMocks'
import { activityApi } from './activityApi'

export interface DocumentInput {
  name: string
  type: string
  fileName: string
  number?: string
  issuer?: string
  issuedAt?: string
  expiresAt?: string
  fileUrl?: string
  verificationSource?: CompanyDocumentVerificationSource
}

export type DocumentMetadataUpdate = Partial<
  Pick<
    CompanyDocument,
    | 'name'
    | 'type'
    | 'number'
    | 'issuer'
    | 'issuedAt'
    | 'expiresAt'
    | 'fileUrl'
    | 'verificationSource'
    | 'fileName'
  >
>

const DEFAULT_ACTOR = 'Анна Смирнова'

interface DocumentDto {
  id: number
  company_id: number
  name: string
  type: string
  file_name: string
  status: string
  number?: string | null
  issuer?: string | null
  issued_at?: string | null
  expires_at?: string | null
  file_url?: string | null
  verification_source?: string
  uploaded_at: string
  updated_at: string
}

function mapDoc(dto: DocumentDto): CompanyDocument {
  return {
    id: String(dto.id),
    companyId: String(dto.company_id),
    name: dto.name,
    type: dto.type,
    fileName: dto.file_name,
    status: dto.status as CompanyDocument['status'],
    uploadedAt: dto.uploaded_at,
    number: dto.number ?? undefined,
    issuer: dto.issuer ?? undefined,
    issuedAt: dto.issued_at ?? undefined,
    expiresAt: dto.expires_at ?? undefined,
    fileUrl: dto.file_url ?? undefined,
    verificationSource: (dto.verification_source as CompanyDocumentVerificationSource) ?? undefined,
    updatedAt: dto.updated_at,
  }
}

function toDocBody(input: DocumentInput | DocumentMetadataUpdate) {
  return {
    name: input.name,
    type: input.type,
    file_name: 'fileName' in input ? input.fileName : undefined,
    number: input.number,
    issuer: input.issuer,
    issued_at: input.issuedAt,
    expires_at: input.expiresAt,
    file_url: input.fileUrl,
    verification_source: input.verificationSource,
  }
}

export const documentsApi = {
  async list(companyId?: string): Promise<CompanyDocument[]> {
    if (isReal('documents')) {
      try {
        const { data } = await apiClient.get<DocumentDto[]>('/companies/me/documents')
        return data.map(mapDoc)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    if (!companyId) throw new Error('companyId required in mock mode')
    return mockCompanyDocuments.filter((d) => d.companyId === companyId)
  },

  async getById(id: string, companyId?: string): Promise<CompanyDocument> {
    if (isReal('documents')) {
      const all = await documentsApi.list(companyId)
      const doc = all.find((d) => d.id === id)
      if (!doc) throw new Error('Документ не найден')
      return doc
    }
    await delay()
    const doc = mockCompanyDocuments.find((d) => d.id === id)
    if (!doc) throw new Error('Документ не найден')
    return { ...doc }
  },

  async add(input: DocumentInput, companyId?: string): Promise<CompanyDocument> {
    if (isReal('documents')) {
      try {
        const { data } = await apiClient.post<DocumentDto>('/companies/me/documents', {
          name: input.name,
          type: input.type,
          file_name: input.fileName,
          number: input.number,
          issuer: input.issuer,
          issued_at: input.issuedAt,
          expires_at: input.expiresAt,
          file_url: input.fileUrl,
          verification_source: input.verificationSource,
        })
        return mapDoc(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    if (!companyId) throw new Error('companyId required in mock mode')
    const now = new Date().toISOString()
    const doc: CompanyDocument = {
      id: `doc-${Date.now()}`,
      companyId,
      name: input.name,
      type: input.type,
      fileName: input.fileName,
      status: COMPANY_DOCUMENT_STATUS.PENDING,
      uploadedAt: now,
      number: input.number,
      issuer: input.issuer,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
      fileUrl: input.fileUrl,
      verificationSource:
        input.verificationSource ?? COMPANY_DOCUMENT_VERIFICATION_SOURCE.COMPANY_DATA,
      updatedAt: now,
    }
    mockCompanyDocuments.push(doc)
    persistCompanyDocuments()
    activityApi.appendSync({
      companyId,
      type: COMPANY_ACTIVITY_TYPE.DOCUMENT_UPLOADED,
      actorName: DEFAULT_ACTOR,
      action: 'загрузила документ',
      entityLabel: doc.name,
    })
    return doc
  },

  async update(id: string, patch: DocumentMetadataUpdate): Promise<CompanyDocument> {
    if (isReal('documents')) {
      try {
        const { data } = await apiClient.patch<DocumentDto>(
          `/companies/me/documents/${id}`,
          toDocBody(patch),
        )
        return mapDoc(data)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    const doc = mockCompanyDocuments.find((d) => d.id === id)
    if (!doc) throw new Error('Документ не найден')
    Object.assign(doc, patch, { updatedAt: new Date().toISOString() })
    persistCompanyDocuments()
    return { ...doc }
  },

  async remove(id: string): Promise<void> {
    if (isReal('documents')) {
      await apiClient.delete(`/companies/me/documents/${id}`)
      return
    }
    await delay()
    const idx = mockCompanyDocuments.findIndex((d) => d.id === id)
    if (idx < 0) throw new Error('Документ не найден')
    mockCompanyDocuments.splice(idx, 1)
    persistCompanyDocuments()
  },

  async replace(id: string, input: DocumentInput): Promise<CompanyDocument> {
    if (isReal('documents')) {
      return documentsApi.update(id, {
        name: input.name,
        type: input.type,
        fileName: input.fileName,
        number: input.number,
        issuer: input.issuer,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
        fileUrl: input.fileUrl,
        verificationSource: input.verificationSource,
      })
    }
    await delay()
    const doc = mockCompanyDocuments.find((d) => d.id === id)
    if (!doc) throw new Error('Документ не найден')
    const now = new Date().toISOString()
    Object.assign(doc, {
      name: input.name,
      type: input.type,
      fileName: input.fileName,
      number: input.number,
      issuer: input.issuer,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
      fileUrl: input.fileUrl,
      verificationSource:
        input.verificationSource ?? COMPANY_DOCUMENT_VERIFICATION_SOURCE.COMPANY_DATA,
      status: COMPANY_DOCUMENT_STATUS.PENDING,
      uploadedAt: now,
      updatedAt: now,
    })
    persistCompanyDocuments()
    return { ...doc }
  },
}
