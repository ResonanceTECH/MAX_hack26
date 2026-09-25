import { z } from 'zod'

export const moderationDecisionSchema = z.object({
  reason: z.string().min(5, 'Укажите причину (минимум 5 символов)'),
})

export type ModerationDecisionFormValues = z.infer<typeof moderationDecisionSchema>
