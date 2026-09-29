import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import {
  usePublishOpportunity,
  useSaveOpportunityDraft,
} from '@/entities/opportunity/api/queries'
import type { Match } from '@/entities/match'
import {
  draftToFormValues,
  opportunityFormSchema,
  parseOpportunityText,
  type OpportunityFormValues,
  type ParsedOpportunityDraft,
} from '@/features/opportunity-create/lib/parseOpportunityText'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { OPPORTUNITY_CATEGORIES, INDUSTRIES } from '@/shared/constants/labels'
import { OPPORTUNITY_TYPE_LABELS } from '@/shared/constants/labels'
import { companyDetailsPath, opportunityDetailsPath, ROUTES } from '@/shared/constants/routes'
import { formatBudgetRange } from '@/shared/lib/format'
import {
  AppButton,
  AppInput,
  AppSelect,
  AppTextarea,
  CommaListInput,
  PageHeader,
  RegionAutocomplete,
} from '@/shared/ui'
import { MatchCard } from '@/widgets/MatchCard/MatchCard'

type Step = 'describe' | 'structured' | 'form' | 'preview' | 'success' | 'draft-saved'

function setBudgetFieldValue(value: unknown): number | null {
  if (value === '' || value == null) return null
  const n = typeof value === 'number' ? value : Number(String(value).replace(/\s/g, ''))
  return Number.isFinite(n) ? n : null
}

function toPayload(values: OpportunityFormValues) {
  return {
    title: values.title,
    description: values.description,
    type: values.type,
    category: values.category,
    subcategory: values.subcategory,
    industries: values.industries,
    skills: values.skills,
    technologies: values.technologies,
    budgetMin: values.budgetMin,
    budgetMax: values.budgetMax,
    currency: values.currency,
    region: values.region,
    remoteAllowed: values.remoteAllowed,
    proposalDeadline: values.proposalDeadline,
    executionDeadline: values.executionDeadline,
  }
}

export function CreateOpportunityPage() {
  const navigate = useNavigate()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const [step, setStep] = useState<Step>('describe')
  const [rawText, setRawText] = useState('')
  const [draft, setDraft] = useState<ParsedOpportunityDraft | null>(null)
  const [parsing, setParsing] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [matches, setMatches] = useState<Match[]>([])

  const publishMutation = usePublishOpportunity()
  const draftMutation = useSaveOpportunityDraft()

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'service',
      category: '',
      subcategory: '',
      industries: [],
      skills: [],
      technologies: [],
      budgetMin: null,
      budgetMax: null,
      currency: 'RUB',
      region: 'Москва',
      remoteAllowed: true,
      proposalDeadline: '',
      executionDeadline: null,
    },
  })

  const handleParse = async () => {
    if (rawText.trim().length < 10) return
    setParsing(true)
    try {
      const parsed = await parseOpportunityText(rawText)
      setDraft(parsed)
      form.reset(draftToFormValues(parsed))
      setStep('structured')
    } finally {
      setParsing(false)
    }
  }

  const onSubmit = form.handleSubmit(async (values: OpportunityFormValues) => {
    setStep('preview')
    void values
  })

  const publish = async () => {
    const values = form.getValues()
    const result = await publishMutation.mutateAsync(toPayload(values))
    setCreatedId(result.opportunity.id)
    setMatches(result.matches)
    setStep('success')
    showSuccess('Запрос опубликован')
  }

  const saveDraft = async () => {
    const values = form.getValues()
    const created = await draftMutation.mutateAsync(toPayload(values))
    setCreatedId(created.id)
    showSuccess('Запрос сохранён')
    void navigate(ROUTES.MY_REQUESTS)
  }

  const submitting = publishMutation.isPending || draftMutation.isPending

  return (
    <Box>
      <PageHeader
        title="Создание запроса"
        subtitle="Опишите потребность — мы поможем структурировать"
      />

      {step === 'describe' ? (
        <Stack spacing={2}>
          <Typography variant="h2">Опишите, что вам нужно</Typography>
          <AppTextarea
            label="Описание задачи"
            placeholder="Нужен подрядчик на разработку CRM для медицинской компании. Бюджет до 500 тысяч. React, интеграция с 1С."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <AppButton
            variant="contained"
            loading={parsing}
            onClick={() => void handleParse()}
            disabled={rawText.trim().length < 10}
          >
            Продолжить
          </AppButton>
        </Stack>
      ) : null}

      {step === 'structured' && draft ? (
        <Stack spacing={2}>
          <Typography variant="h2">Мы поняли ваш запрос так</Typography>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack spacing={1.5}>
              <FieldPreview label="Категория" value={draft.category} />
              <FieldPreview label="Отрасль" value={draft.industries.join(', ')} />
              <FieldPreview
                label="Бюджет"
                value={formatBudgetRange(draft.budgetMin, draft.budgetMax)}
              />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Технологии
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                  {draft.technologies.map((t) => (
                    <Chip key={t} label={t} size="small" />
                  ))}
                </Stack>
              </Box>
              <FieldPreview label="Срок" value={draft.executionHint} />
            </Stack>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Все поля можно отредактировать на следующем шаге.
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <AppButton variant="outlined" onClick={() => setStep('describe')}>
              Назад
            </AppButton>
            <AppButton variant="contained" onClick={() => setStep('form')}>
              Редактировать и опубликовать
            </AppButton>
          </Stack>
        </Stack>
      ) : null}

      {step === 'form' ? (
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <AppInput
              label="Название"
              error={Boolean(form.formState.errors.title)}
              helperText={form.formState.errors.title?.message}
              {...form.register('title')}
            />
            <AppTextarea
              label="Описание"
              error={Boolean(form.formState.errors.description)}
              helperText={form.formState.errors.description?.message}
              {...form.register('description')}
            />
            <AppSelect
              label="Тип"
              value={form.watch('type')}
              options={Object.entries(OPPORTUNITY_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              onChange={(v) => form.setValue('type', v)}
            />
            <AppSelect
              label="Категория"
              value={form.watch('category')}
              options={OPPORTUNITY_CATEGORIES.map((c) => ({ value: c, label: c }))}
              error={Boolean(form.formState.errors.category)}
              helperText={form.formState.errors.category?.message}
              onChange={(v) => form.setValue('category', v, { shouldValidate: true })}
            />
            <CommaListInput
              label="Отрасли (через запятую)"
              error={Boolean(form.formState.errors.industries)}
              helperText={
                form.formState.errors.industries?.message ??
                `Вертикаль рынка, не категория услуги. Например: ${INDUSTRIES.slice(0, 4).join(', ')}`
              }
              value={form.watch('industries')}
              onChange={(next) => form.setValue('industries', next, { shouldValidate: true })}
            />
            <CommaListInput
              label="Технологии (через запятую)"
              value={form.watch('technologies')}
              onChange={(next) => form.setValue('technologies', next)}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <AppInput
                label="Бюджет от"
                type="number"
                inputMode="numeric"
                {...form.register('budgetMin', { setValueAs: setBudgetFieldValue })}
              />
              <AppInput
                label="Бюджет до"
                type="number"
                inputMode="numeric"
                {...form.register('budgetMax', { setValueAs: setBudgetFieldValue })}
              />
            </Stack>
            <Controller
              name="region"
              control={form.control}
              render={({ field, fieldState }) => (
                <RegionAutocomplete
                  label="Регион"
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <AppInput
              label="Дедлайн приёма предложений"
              type="date"
              InputLabelProps={{ shrink: true }}
              error={Boolean(form.formState.errors.proposalDeadline)}
              helperText={form.formState.errors.proposalDeadline?.message}
              {...form.register('proposalDeadline')}
            />
            <Controller
              name="remoteAllowed"
              control={form.control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Допускается удалённая работа"
                />
              )}
            />
            <Stack direction="row" spacing={1.5}>
              <AppButton variant="outlined" onClick={() => setStep('structured')}>
                Назад
              </AppButton>
              <AppButton type="submit" variant="contained">
                К предпросмотру
              </AppButton>
            </Stack>
          </Stack>
        </Box>
      ) : null}

      {step === 'preview' ? (
        <Stack spacing={2}>
          <Typography variant="h2">Как заказ увидят исполнители</Typography>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h3" sx={{ mb: 1 }}>
              {form.getValues('title')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              {form.getValues('description')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {form.getValues('category')} · {form.getValues('industries').join(', ')} ·{' '}
              {form.getValues('region')}
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
              {formatBudgetRange(form.getValues('budgetMin'), form.getValues('budgetMax'))}
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              {form.getValues('technologies').map((t) => (
                <Chip key={t} label={t} size="small" />
              ))}
            </Stack>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <AppButton variant="outlined" onClick={() => setStep('form')}>
              Назад
            </AppButton>
            <AppButton variant="outlined" onClick={() => saveDraft()} loading={submitting}>
              Сохранить черновик
            </AppButton>
            <AppButton variant="contained" onClick={() => publish()} loading={submitting}>
              Опубликовать
            </AppButton>
          </Stack>
        </Stack>
      ) : null}

      {step === 'draft-saved' ? (
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="h2">Черновик сохранён</Typography>
          <Typography variant="body1" color="text.secondary">
            Запрос доступен во вкладке «Черновики» в разделе «Мои запросы».
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <AppButton component={RouterLink} to={ROUTES.MY_REQUESTS} variant="contained">
              Мои запросы
            </AppButton>
            {createdId ? (
              <AppButton
                component={RouterLink}
                to={opportunityDetailsPath(createdId)}
                variant="outlined"
              >
                Открыть черновик
              </AppButton>
            ) : null}
          </Stack>
        </Stack>
      ) : null}

      {step === 'success' ? (
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="h2">Запрос опубликован</Typography>
          <Typography variant="body1" color="text.secondary">
            Ищем подходящие компании...
          </Typography>
          <Typography variant="h3" color="secondary">
            Найдено {matches.length} подходящих компаний
          </Typography>
          <Typography variant="h4" sx={{ mt: 1 }}>
            Почему подходит
          </Typography>
          <Stack spacing={1.5} sx={{ width: '100%' }}>
            {matches.slice(0, 5).map((match) => (
              <Box
                key={match.id}
                component={RouterLink}
                to={`${companyDetailsPath(match.companyId)}?fromOpportunity=${createdId}`}
                sx={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <MatchCard match={match} />
              </Box>
            ))}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <AppButton
              variant="contained"
              onClick={() => {
                if (createdId) void navigate(opportunityDetailsPath(createdId))
              }}
            >
              Посмотреть рекомендации
            </AppButton>
            <AppButton
              variant="outlined"
              onClick={() => {
                if (createdId) void navigate(opportunityDetailsPath(createdId))
              }}
            >
              Перейти к запросу
            </AppButton>
          </Stack>
        </Stack>
      ) : null}
    </Box>
  )
}

function FieldPreview({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  )
}
