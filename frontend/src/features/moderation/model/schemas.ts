import { z } from 'zod'

const otherRequiresComment = (reasonCode: string, comment: string | undefined) => {
  if (reasonCode === 'OTHER' && (!comment || comment.trim().length < 5)) {
    return false
  }
  return true
}

export const rejectModerationSchema = z
  .object({
    reasonCode: z.string().min(1, 'Выберите причину'),
    comment: z.string().optional(),
    privateNote: z.string().optional(),
  })
  .refine((v) => otherRequiresComment(v.reasonCode, v.comment), {
    message: 'Для «Другое» укажите комментарий (минимум 5 символов)',
    path: ['comment'],
  })

export type RejectModerationFormValues = z.infer<typeof rejectModerationSchema>

export const requestChangesSchema = z.object({
  fields: z.array(z.string()).min(1, 'Выберите хотя бы одно поле'),
  comment: z.string().min(5, 'Опишите, что нужно исправить'),
  privateNote: z.string().optional(),
})

export type RequestChangesFormValues = z.infer<typeof requestChangesSchema>

export const blockModerationSchema = z.object({
  reasonCode: z.string().min(1, 'Выберите причину'),
  comment: z.string().min(5, 'Укажите причину блокировки'),
  privateNote: z.string().optional(),
})

export type BlockModerationFormValues = z.infer<typeof blockModerationSchema>

export const escalateSchema = z
  .object({
    reasonCode: z.string().min(1, 'Выберите причину'),
    comment: z.string().min(5, 'Добавьте комментарий'),
    privateNote: z.string().optional(),
  })
  .refine((v) => otherRequiresComment(v.reasonCode, v.comment), {
    message: 'Для «Другое» укажите комментарий',
    path: ['comment'],
  })

export type EscalateFormValues = z.infer<typeof escalateSchema>

export const resolveReportSchema = z.object({
  resolutionCode: z.string().min(1, 'Выберите причину'),
  comment: z.string().optional(),
  applyAction: z.enum(['none', 'request_changes', 'reject', 'block']),
}).refine((v) => otherRequiresComment(v.resolutionCode, v.comment), {
  message: 'Для «Другое» укажите комментарий',
  path: ['comment'],
})

export type ResolveReportFormValues = z.infer<typeof resolveReportSchema>

/** @deprecated use rejectModerationSchema */
export const moderationDecisionSchema = z.object({
  reason: z.string().min(5, 'Укажите причину (минимум 5 символов)'),
})

/** @deprecated */
export type ModerationDecisionFormValues = z.infer<typeof moderationDecisionSchema>
