import { COMPANY_ACTIVITY_TYPE } from '@/entities/company-activity'
import {
  COMPANY_DOCUMENT_STATUS,
  COMPANY_DOCUMENT_VERIFICATION_SOURCE,
  type CompanyDocument,
  type CompanyDocumentVerificationSource,
} from '@/entities/company-document'
import { delay } from '@/shared/lib/delay'
import { CURRENT_COMPANY_ID, mockCompanyDocuments } from '@/shared/mocks'
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

export const documentsApi = {
  async list(companyId = CURRENT_COMPANY_ID): Promise<CompanyDocument[]> {
    await delay()
    return mockCompanyDocuments.filter((d) => d.companyId === companyId)
  },

  async getById(id: string): Promise<CompanyDocument> {
    await delay()
    const doc = mockCompanyDocuments.find((d) => d.id === id)
    if (!doc) throw new Error('Документ не найден')
    return { ...doc }
  },

  async add(input: DocumentInput, companyId = CURRENT_COMPANY_ID): Promise<CompanyDocument> {
    await delay()
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
    await delay()
    const doc = mockCompanyDocuments.find((d) => d.id === id)
    if (!doc) throw new Error('Документ не найден')
    Object.assign(doc, patch, { updatedAt: new Date().toISOString() })
    persistCompanyDocuments()
    activityApi.appendSync({
      companyId: doc.companyId,
      type: COMPANY_ACTIVITY_TYPE.DOCUMENT_REPLACED,
      actorName: DEFAULT_ACTOR,
      action: 'обновила метаданные документа',
      entityLabel: doc.name,
    })
    return { ...doc }
  },

  async remove(id: string): Promise<void> {
    await delay()
    const idx = mockCompanyDocuments.findIndex((d) => d.id === id)
    if (idx < 0) throw new Error('Документ не найден')
    const [removed] = mockCompanyDocuments.splice(idx, 1)
    persistCompanyDocuments()
    if (removed) {
      activityApi.appendSync({
        companyId: removed.companyId,
        type: COMPANY_ACTIVITY_TYPE.DOCUMENT_REMOVED,
        actorName: DEFAULT_ACTOR,
        action: 'удалила документ',
        entityLabel: removed.name,
      })
    }
  },

  async replace(id: string, input: DocumentInput): Promise<CompanyDocument> {
    await delay()
    const doc = mockCompanyDocuments.find((d) => d.id === id)
    if (!doc) throw new Error('Документ не найден')
    const now = new Date().toISOString()
    doc.name = input.name
    doc.type = input.type
    doc.fileName = input.fileName
    doc.number = input.number
    doc.issuer = input.issuer
    doc.issuedAt = input.issuedAt
    doc.expiresAt = input.expiresAt
    doc.fileUrl = input.fileUrl
    doc.verificationSource =
      input.verificationSource ?? COMPANY_DOCUMENT_VERIFICATION_SOURCE.COMPANY_DATA
    doc.status = COMPANY_DOCUMENT_STATUS.PENDING
    doc.uploadedAt = now
    doc.updatedAt = now
    persistCompanyDocuments()
    activityApi.appendSync({
      companyId: doc.companyId,
      type: COMPANY_ACTIVITY_TYPE.DOCUMENT_REPLACED,
      actorName: DEFAULT_ACTOR,
      action: 'заменила документ',
      entityLabel: doc.name,
    })
    return { ...doc }
  },
}
