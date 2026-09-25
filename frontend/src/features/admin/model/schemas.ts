import { z } from 'zod'
import { SYSTEM_ROLES } from '@/entities/user'

export const blockUserSchema = z.object({
  reasonCode: z.enum([
    'SECURITY_ISSUE',
    'FRAUD_ABUSE',
    'TERMS_VIOLATION',
    'DUPLICATE_ACCOUNT',
    'ADMINISTRATIVE_DECISION',
    'OTHER',
  ]),
  reason: z.string().min(3, 'Укажите причину').max(500),
})

export type BlockUserFormValues = z.infer<typeof blockUserSchema>

export const changeUserRoleSchema = z.object({
  newRole: z.enum([
    SYSTEM_ROLES.BUSINESS_USER,
    SYSTEM_ROLES.COMPANY_ADMIN,
    SYSTEM_ROLES.MODERATOR,
    SYSTEM_ROLES.PLATFORM_ADMIN,
  ]),
  reason: z.string().min(5, 'Причина обязательна').max(500),
  confirmPlatformAdmin: z.boolean().optional(),
})

export type ChangeUserRoleFormValues = z.infer<typeof changeUserRoleSchema>

export const changeCompanyStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED', 'ARCHIVED']),
  reason: z.string().min(3, 'Укажите причину').max(500),
})

export type ChangeCompanyStatusFormValues = z.infer<typeof changeCompanyStatusSchema>

export const changeVerificationSchema = z.object({
  verificationStatus: z.enum([
    'NOT_VERIFIED',
    'PENDING',
    'VERIFIED',
    'REJECTED',
    'REQUIRES_UPDATE',
  ]),
  reason: z.string().min(3, 'Причина обязательна').max(500),
})

export type ChangeVerificationFormValues = z.infer<typeof changeVerificationSchema>

export const dictionaryItemSchema = z.object({
  name: z.string().min(2, 'Название слишком короткое').max(120),
  slug: z
    .string()
    .min(2, 'Slug обязателен')
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Только латиница, цифры и дефис'),
  type: z.enum([
    'categories',
    'subcategories',
    'industries',
    'skills',
    'technologies',
    'regions',
    'documentTypes',
    'opportunityTypes',
    'verificationReasons',
    'reportReasons',
  ]),
  parentId: z.string().nullable().optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  status: z.enum(['active', 'archived']).default('active'),
  aliases: z.string().optional(),
  category: z.string().optional(),
})

export type DictionaryItemFormValues = z.infer<typeof dictionaryItemSchema>

/** @deprecated use dictionaryItemSchema */
export const dictionarySchema = dictionaryItemSchema.pick({ name: true, type: true })
export type DictionaryFormValues = z.infer<typeof dictionarySchema>

export const platformSettingsGeneralSchema = z.object({
  productName: z.string().min(2).max(80),
  supportContact: z.string().min(3).max(120),
  defaultLocale: z.string().min(2).max(10),
  statusMessage: z.string().max(500),
})

export const platformSettingsMatchingSchema = z.object({
  minScoreToShow: z.coerce.number().min(0).max(100),
  maxRecommendationsPerRequest: z.coerce.number().int().min(1).max(50),
  matchExplanationEnabled: z.boolean(),
  boostVerifiedCompanies: z.boolean(),
})

export const platformSettingsSchema = z.object({
  general: platformSettingsGeneralSchema,
  matching: platformSettingsMatchingSchema,
})

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsSchema>

export const maintenanceModeSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().min(5, 'Причина обязательна').max(500),
  message: z.string().max(500).optional(),
})

export type MaintenanceModeFormValues = z.infer<typeof maintenanceModeSchema>

export const featureFlagChangeSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().min(5, 'Причина обязательна').max(500),
})

export type FeatureFlagChangeFormValues = z.infer<typeof featureFlagChangeSchema>

export const BLOCK_USER_REASON_OPTIONS = [
  { value: 'SECURITY_ISSUE', label: 'Security issue' },
  { value: 'FRAUD_ABUSE', label: 'Fraud / abuse' },
  { value: 'TERMS_VIOLATION', label: 'Terms violation' },
  { value: 'DUPLICATE_ACCOUNT', label: 'Duplicate account' },
  { value: 'ADMINISTRATIVE_DECISION', label: 'Administrative decision' },
  { value: 'OTHER', label: 'Other' },
] as const
