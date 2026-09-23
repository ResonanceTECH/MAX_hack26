import { useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useOpportunity } from '@/entities/opportunity/api/queries'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { proposalApi } from '@/shared/api/proposalApi'
import { ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppIcon,
  AppInput,
  AppTextarea,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusChip,
} from '@/shared/ui'
import { CheckmarkCircle01Icon } from '@/shared/ui/icons'

const proposalFormSchema = z.object({
  price: z.coerce.number().positive('Укажите сумму больше 0'),
  durationDays: z.coerce.number().int().positive('Укажите срок в днях'),
  description: z.string().min(10, 'Минимум 10 символов'),
  included: z.string().min(1, 'Укажите хотя бы один пункт'),
  excluded: z.string().optional(),
  cases: z.string().min(1, 'Укажите хотя бы один кейс'),
  comment: z.string().optional(),
})

type ProposalFormValues = z.infer<typeof proposalFormSchema>

function splitCommaList(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function CreateProposalPage() {
  const { id = '' } = useParams()
  const opportunityQuery = useOpportunity(id)
  const company = useSessionStore((s) => s.company)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      price: undefined,
      durationDays: undefined,
      description: '',
      included: '',
      excluded: '',
      cases: '',
      comment: '',
    },
  })

  if (opportunityQuery.isLoading) return <LoadingState variant="page" />
  if (opportunityQuery.isError || !opportunityQuery.data) {
    return <ErrorState onRetry={() => void opportunityQuery.refetch()} />
  }

  const opportunity = opportunityQuery.data
  const currency = opportunity.currency

  const onSubmit = handleSubmit(async (values) => {
    await proposalApi.create({
      opportunityId: id,
      price: values.price,
      currency,
      durationDays: values.durationDays,
      description: values.description,
      included: splitCommaList(values.included),
      excluded: splitCommaList(values.excluded),
      cases: splitCommaList(values.cases),
      comment: values.comment?.trim() || undefined,
    })
    setSubmitted(true)
  })

  if (submitted) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <AppIcon icon={CheckmarkCircle01Icon} size={56} color="#2E7D4F" sx={{ mb: 2 }} />
        <Typography variant="h1" sx={{ mb: 1 }}>
          Предложение отправлено
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Заказчик получит ваше предложение по запросу «{opportunity.title}».
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Статус:
          </Typography>
          <StatusChip status="submitted" kind="proposal" />
          <Typography variant="body2" color="text.secondary">
            · Ожидает просмотра
          </Typography>
        </Stack>
        <AppButton component={RouterLink} to={ROUTES.MY_PROPOSALS} variant="contained">
          Мои отклики
        </AppButton>
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader
        title="Отклик на запрос"
        subtitle={opportunity.title}
      />
      {company ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          От имени {company.shortName}
        </Typography>
      ) : null}

      <Stack component="form" spacing={2} onSubmit={(e) => void onSubmit(e)} noValidate>
        <AppInput
          label="Стоимость, ₽"
          type="number"
          inputMode="numeric"
          error={Boolean(errors.price)}
          helperText={errors.price?.message}
          {...register('price')}
        />
        <AppInput
          label="Срок, дней"
          type="number"
          inputMode="numeric"
          error={Boolean(errors.durationDays)}
          helperText={errors.durationDays?.message}
          {...register('durationDays')}
        />
        <AppTextarea
          label="Описание предложения"
          error={Boolean(errors.description)}
          helperText={errors.description?.message}
          {...register('description')}
        />
        <AppTextarea
          label="Что включено"
          placeholder="Дизайн, интеграция с 1С, обучение"
          error={Boolean(errors.included)}
          helperText={errors.included?.message ?? 'Через запятую'}
          {...register('included')}
        />
        <AppTextarea
          label="Что не включено"
          placeholder="Хостинг, лицензии"
          helperText="Через запятую"
          {...register('excluded')}
        />
        <AppTextarea
          label="Релевантные кейсы"
          placeholder="CRM для клиники, портал пациента"
          error={Boolean(errors.cases)}
          helperText={errors.cases?.message ?? 'Через запятую'}
          {...register('cases')}
        />
        <AppTextarea label="Комментарий для заказчика (необязательно)" {...register('comment')} />
        <AppButton type="submit" variant="contained" loading={isSubmitting}>
          Отправить предложение
        </AppButton>
      </Stack>
    </Box>
  )
}
