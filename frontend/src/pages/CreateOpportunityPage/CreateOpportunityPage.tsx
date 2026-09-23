import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { opportunityApi } from '@/shared/api/opportunityApi'
import {
  draftToFormValues,
  opportunityFormSchema,
  parseOpportunityText,
  type OpportunityFormValues,
  type ParsedOpportunityDraft,
} from '@/features/opportunity-create/lib/parseOpportunityText'
import { OPPORTUNITY_CATEGORIES, REGIONS } from '@/shared/constants/labels'
import { OPPORTUNITY_TYPE_LABELS } from '@/shared/constants/labels'
import { opportunityDetailsPath } from '@/shared/constants/routes'
import { formatBudgetRange } from '@/shared/lib/format'
import { AppButton, AppInput, AppSelect, AppTextarea, PageHeader } from '@/shared/ui'

type Step = 'describe' | 'structured' | 'form' | 'preview' | 'success'

export function CreateOpportunityPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('describe')
  const [rawText, setRawText] = useState('')
  const [draft, setDraft] = useState<ParsedOpportunityDraft | null>(null)
  const [parsing, setParsing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [matchCount, setMatchCount] = useState(8)

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
    // keep values in form for preview; publish happens on confirm
    void values
  })

  const publish = async () => {
    const values = form.getValues()
    setSubmitting(true)
    try {
      const created = await opportunityApi.create({
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
      })
      await opportunityApi.publish(created.id)
      setCreatedId(created.id)
      setMatchCount(8)
      setStep('success')
    } finally {
      setSubmitting(false)
    }
  }

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
            <AppInput
              label="Отрасли (через запятую)"
              error={Boolean(form.formState.errors.industries)}
              helperText={form.formState.errors.industries?.message}
              value={form.watch('industries').join(', ')}
              onChange={(e) =>
                form.setValue(
                  'industries',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                  { shouldValidate: true },
                )
              }
            />
            <AppInput
              label="Технологии (через запятую)"
              value={form.watch('technologies').join(', ')}
              onChange={(e) =>
                form.setValue(
                  'technologies',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <AppInput
                label="Бюджет от"
                type="number"
                {...form.register('budgetMin', { valueAsNumber: true })}
              />
              <AppInput
                label="Бюджет до"
                type="number"
                {...form.register('budgetMax', { valueAsNumber: true })}
              />
            </Stack>
            <AppSelect
              label="Регион"
              value={form.watch('region')}
              options={REGIONS.map((r) => ({ value: r, label: r }))}
              onChange={(v) => form.setValue('region', v, { shouldValidate: true })}
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
          <Stack direction="row" spacing={1.5}>
            <AppButton variant="outlined" onClick={() => setStep('form')}>
              Назад
            </AppButton>
            <AppButton variant="outlined" onClick={() => void publish()} loading={submitting}>
              Сохранить черновик
            </AppButton>
            <AppButton variant="contained" onClick={() => void publish()} loading={submitting}>
              Опубликовать
            </AppButton>
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
            Найдено {matchCount} подходящих компаний
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <AppButton
              variant="contained"
              onClick={() => {
                if (createdId) void navigate(`${opportunityDetailsPath(createdId)}`)
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
