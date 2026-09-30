import { useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { COMPANY_CASE_STATUS } from '@/entities/company-case'
import { useOpportunity } from '@/entities/opportunity/api/queries'
import { useCreateProposal } from '@/entities/proposal/api/queries'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useCompanyCases } from '@/features/company-management/api/queries'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { ProposalApiError } from '@/shared/api/proposalApi'
import { opportunityDetailsPath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppIcon,
  AppInput,
  AppSelect,
  AppTextarea,
  BentoGrid,
  BentoTile,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusChip,
} from '@/shared/ui'
import { CheckmarkCircle01Icon } from '@/shared/ui/icons'

const NONE_CASE = ''

const proposalFormSchema = z.object({
  // Backend ProposalIn.price is int — floats / 1e+20 from <input type="number"> → 422
  price: z.coerce
    .number({ invalid_type_error: 'Укажите сумму больше 0' })
    .int('Укажите целое число в рублях')
    .positive('Укажите сумму больше 0')
    .max(1_000_000_000_000, 'Слишком большая сумма'),
  durationDays: z.coerce
    .number({ invalid_type_error: 'Укажите срок в днях' })
    .int('Укажите целое число дней')
    .positive('Укажите срок в днях')
    .max(3_650, 'Срок слишком большой'),
  description: z.string().min(10, 'Минимум 10 символов'),
  included: z.string().min(1, 'Укажите хотя бы один пункт'),
  excluded: z.string().optional(),
  /** Selected CompanyCase id, or empty = do not send case_ref. */
  caseId: z.string().optional(),
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
  const { id = '', opportunityId: opportunityIdParam = '' } = useParams()
  const opportunityId = opportunityIdParam || id
  const opportunityQuery = useOpportunity(opportunityId)
  const company = useSessionStore((s) => s.company)
  const casesQuery = useCompanyCases(company?.id)
  const createProposal = useCreateProposal()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [submitted, setSubmitted] = useState(false)
  const [guardError, setGuardError] = useState<string | null>(null)

  const {
    register,
    control,
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
      caseId: NONE_CASE,
      comment: '',
    },
  })

  const caseOptions = useMemo(() => {
    const items = (casesQuery.data ?? []).filter(
      (c) => c.status === COMPANY_CASE_STATUS.PUBLISHED || c.status === COMPANY_CASE_STATUS.DRAFT,
    )
    return [
      { value: NONE_CASE, label: 'Без привязки к кейсу' },
      ...items.map((c) => ({ value: c.id, label: c.title })),
    ]
  }, [casesQuery.data])

  if (opportunityQuery.isLoading) return <LoadingState variant="page" />
  if (opportunityQuery.isError || !opportunityQuery.data) {
    return <ErrorState onRetry={() => void opportunityQuery.refetch()} />
  }

  const opportunity = opportunityQuery.data
  const currency = opportunity.currency
  const isOwn = opportunity.company.id === company?.id
  const isBlocked = opportunity.status === 'expired' || opportunity.status === 'closed'

  if (isOwn || isBlocked) {
    const message = isOwn
      ? 'Это ваш запрос. Нельзя откликнуться на собственный запрос.'
      : opportunity.status === 'expired'
        ? 'Приём предложений завершён'
        : 'Запрос закрыт'
    return (
      <Box>
        <PageHeader title="Отклик на запрос" subtitle={opportunity.title} />
        <Alert severity="info" sx={{ mb: 2 }}>
          {message}
        </Alert>
        <AppButton component={RouterLink} to={opportunityDetailsPath(opportunity.id)} variant="contained">
          К запросу
        </AppButton>
      </Box>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    setGuardError(null)
    const selected = (casesQuery.data ?? []).find((c) => c.id === values.caseId)
    try {
      await createProposal.mutateAsync({
        opportunityId,
        price: values.price,
        currency,
        durationDays: values.durationDays,
        description: values.description,
        included: splitCommaList(values.included),
        excluded: splitCommaList(values.excluded),
        // Titles only for solution_text — never raw free-text as case_ref
        cases: selected ? [selected.title] : [],
        caseId: values.caseId?.trim() ? values.caseId : null,
        comment: values.comment?.trim() || undefined,
      })
      showSuccess('Предложение отправлено')
      setSubmitted(true)
    } catch (error) {
      const message =
        error instanceof ProposalApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Не удалось отправить предложение'
      setGuardError(message)
      showError(message)
    }
  })

  if (submitted) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <AppIcon icon={CheckmarkCircle01Icon} size={56} color="#2E7D4F" sx={{ mb: 2 }} />
        <Typography variant="h1" sx={{ mb: 1 }}>
          Предложение отправлено
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Заказчик получит уведомление. Статус предложения можно отслеживать в разделе «Мои
          отклики».
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Статус:
          </Typography>
          <StatusChip status="submitted" kind="proposal" />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
          <AppButton component={RouterLink} to={ROUTES.MY_PROPOSALS} variant="contained">
            Мои отклики
          </AppButton>
          <AppButton
            component={RouterLink}
            to={opportunityDetailsPath(opportunity.id)}
            variant="outlined"
          >
            Вернуться к заказу
          </AppButton>
        </Stack>
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader title="Отклик на запрос" subtitle={opportunity.title} />
      {guardError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {guardError}
        </Alert>
      ) : null}

      <BentoGrid>
        <BentoTile span={8}>
          <Stack component="form" spacing={2} onSubmit={(e) => void onSubmit(e)} noValidate>
            <AppInput
              label="Стоимость, ₽"
              type="number"
              inputMode="numeric"
              inputProps={{ min: 1, step: 1, max: 1_000_000_000_000 }}
              error={Boolean(errors.price)}
              helperText={errors.price?.message}
              {...register('price', { valueAsNumber: true })}
            />
            <AppInput
              label="Срок, дней"
              type="number"
              inputMode="numeric"
              inputProps={{ min: 1, step: 1, max: 3650 }}
              error={Boolean(errors.durationDays)}
              helperText={errors.durationDays?.message}
              {...register('durationDays', { valueAsNumber: true })}
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
            <Controller
              name="caseId"
              control={control}
              render={({ field }) => (
                <AppSelect
                  label="Релевантный кейс"
                  options={caseOptions}
                  value={field.value ?? NONE_CASE}
                  onChange={field.onChange}
                  helperText={
                    caseOptions.length <= 1
                      ? 'Нет кейсов в профиле — можно отправить без привязки или добавить в «Кейсы»'
                      : 'Только кейс из профиля компании (поле case_ref на бэке). Необязательно.'
                  }
                />
              )}
            />
            {caseOptions.length <= 1 ? (
              <AppButton
                component={RouterLink}
                to={ROUTES.PROFILE_COMPANY_CASES}
                variant="text"
                size="small"
                sx={{ alignSelf: 'flex-start', mt: -1 }}
              >
                Перейти к кейсам компании
              </AppButton>
            ) : null}
            <AppTextarea
              label="Комментарий для заказчика (необязательно)"
              {...register('comment')}
            />
            <AppButton
              type="submit"
              variant="contained"
              loading={isSubmitting || createProposal.isPending}
            >
              Отправить предложение
            </AppButton>
          </Stack>
        </BentoTile>

        <BentoTile span={4} variant="emphasis">
          <Typography variant="h4" sx={{ mb: 1 }}>
            Запрос
          </Typography>
          <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
            {opportunity.title}
          </Typography>
          {company ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              От имени {company.shortName} · заказчик: {opportunity.company.shortName}
            </Typography>
          ) : null}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {opportunity.description.slice(0, 220)}
            {opportunity.description.length > 220 ? '…' : ''}
          </Typography>
          <AppButton
            component={RouterLink}
            to={opportunityDetailsPath(opportunity.id)}
            variant="outlined"
            size="small"
          >
            Открыть запрос
          </AppButton>
        </BentoTile>
      </BentoGrid>
    </Box>
  )
}
