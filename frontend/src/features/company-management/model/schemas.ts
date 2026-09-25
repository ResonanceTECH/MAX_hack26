import { z } from 'zod'
import { COMPANY_MEMBER_ROLES } from '@/entities/company-member'
import { COMPANY_SERVICE_STATUS } from '@/entities/company-service'
import { COMPANY_CASE_STATUS } from '@/entities/company-case'

export const companyProfileSchema = z.object({
  description: z.string().min(20, 'Описание слишком короткое').max(2000),
  website: z
    .string()
    .refine((v) => v === '' || /^https?:\/\//.test(v), 'Укажите корректный URL')
    .optional()
    .nullable(),
  region: z.string().min(2, 'Укажите регион'),
  industries: z.array(z.string()).min(1, 'Выберите хотя бы одну отрасль'),
  capabilities: z.array(z.string()),
  technologies: z.array(z.string()).min(1, 'Укажите хотя бы одну технологию'),
  services: z.array(z.string()).optional(),
  shortName: z.string().min(2).max(80).optional(),
  priceFrom: z.number().nullable().optional(),
  priceTo: z.number().nullable().optional(),
})

export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>

export const inviteMemberSchema = z.object({
  email: z.string().email('Некорректный email'),
  firstName: z.string().min(2, 'Укажите имя'),
  lastName: z.string().min(2, 'Укажите фамилию'),
  role: z.enum([
    COMPANY_MEMBER_ROLES.COMPANY_ADMIN,
    COMPANY_MEMBER_ROLES.MANAGER,
    COMPANY_MEMBER_ROLES.VIEWER,
  ]),
  optionalMessage: z.string().max(500).optional(),
})

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>

export const serviceSchema = z.object({
  title: z.string().min(3, 'Укажите название'),
  description: z.string().min(10, 'Описание слишком короткое'),
  category: z.string().min(2, 'Укажите категорию'),
  shortDescription: z.string().max(200).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  currency: z.string().optional(),
  regions: z.array(z.string()).optional(),
  remote: z.boolean().optional(),
  technologies: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  targetIndustries: z.array(z.string()).optional(),
  status: z
    .enum([
      COMPANY_SERVICE_STATUS.DRAFT,
      COMPANY_SERVICE_STATUS.ACTIVE,
      COMPANY_SERVICE_STATUS.HIDDEN,
      COMPANY_SERVICE_STATUS.ARCHIVED,
    ])
    .optional(),
})

export type ServiceFormValues = z.infer<typeof serviceSchema>

export const caseSchema = z.object({
  title: z.string().min(3, 'Укажите название'),
  industry: z.string().min(2, 'Укажите отрасль'),
  description: z.string().min(10, 'Описание слишком короткое'),
  result: z.string().min(5, 'Укажите результат'),
  technologies: z.array(z.string()).min(1, 'Добавьте технологии'),
  clientName: z.string().optional(),
  clientVisible: z.boolean().optional(),
  solution: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  coverUrl: z.string().optional(),
  externalUrl: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  status: z
    .enum([
      COMPANY_CASE_STATUS.DRAFT,
      COMPANY_CASE_STATUS.PUBLISHED,
      COMPANY_CASE_STATUS.HIDDEN,
      COMPANY_CASE_STATUS.ARCHIVED,
    ])
    .optional(),
})

export type CaseFormValues = z.infer<typeof caseSchema>

export const documentSchema = z.object({
  name: z.string().min(2, 'Укажите название'),
  type: z.string().min(2, 'Укажите тип'),
  fileName: z.string().min(1, 'Укажите имя файла'),
  number: z.string().optional(),
  issuer: z.string().optional(),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
})

export type DocumentFormValues = z.infer<typeof documentSchema>

export const companySettingsSchema = z.object({
  notifications: z.object({
    newProposals: z.boolean(),
    matchingOrders: z.boolean(),
    proposalStatusChanges: z.boolean(),
    shortlist: z.boolean(),
    negotiations: z.boolean(),
    deadlineReminders: z.boolean(),
    companyManagementEvents: z.boolean(),
  }),
  visibility: z.object({
    publicProfile: z.boolean(),
    showServices: z.boolean(),
    showPrices: z.boolean(),
    showCases: z.boolean(),
    showDocuments: z.boolean(),
  }),
  matching: z.object({
    receiveOrderRecommendations: z.boolean(),
    showInCustomerRecommendations: z.boolean(),
    useCasesInMatching: z.boolean(),
    useDocumentsInMatching: z.boolean(),
  }),
  archived: z.boolean(),
})

export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>
