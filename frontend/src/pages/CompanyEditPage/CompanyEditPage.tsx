import { useEffect, useState } from 'react'
import { Link as RouterLink, useBlocker } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  UnsavedChangesDialog,
  canEditVerifiedField,
  companyProfileSchema,
  type CompanyProfileFormValues,
  useUpdateCompanyProfile,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { NeedsChangesBanner } from '@/features/moderation/ui/NeedsChangesBanner'
import { ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppInput,
  AppTextarea,
  CommaListInput,
  LoadingState,
  PageHeader,
  RegionAutocomplete,
  Section,
} from '@/shared/ui'

export function CompanyEditPage() {
  const company = useSessionStore((s) => s.company)
  const updateProfile = useUpdateCompanyProfile(company?.id)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [allowLeave, setAllowLeave] = useState(false)

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      description: '',
      website: '',
      region: '',
      industries: [],
      capabilities: [],
      technologies: [],
      services: [],
    },
  })

  useEffect(() => {
    if (!company) return
    form.reset({
      description: company.description,
      website: company.website ?? '',
      region: company.region,
      industries: company.industries,
      capabilities: company.capabilities,
      technologies: company.technologies,
      services: company.services,
      shortName: company.shortName,
      priceFrom: company.priceFrom,
      priceTo: company.priceTo,
    })
  }, [company, form])

  const isDirty = form.formState.isDirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowLeave && isDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  if (!company) return <LoadingState variant="page" />

  const lockedInn = !canEditVerifiedField('inn', company)
  const lockedOgrn = !canEditVerifiedField('ogrn', company)
  const lockedName = !canEditVerifiedField('name', company)

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync({
        description: values.description,
        website: values.website || null,
        region: values.region,
        industries: values.industries,
        capabilities: values.capabilities,
        technologies: values.technologies,
        services: values.services,
        shortName: values.shortName,
        priceFrom: values.priceFrom ?? null,
        priceTo: values.priceTo ?? null,
      })
      useSessionStore.setState({
        company: {
          ...company,
          description: values.description,
          website: values.website || null,
          region: values.region,
          industries: values.industries,
          capabilities: values.capabilities,
          technologies: values.technologies,
          services: values.services ?? company.services,
          shortName: values.shortName ?? company.shortName,
          priceFrom: values.priceFrom ?? null,
          priceTo: values.priceTo ?? null,
        },
      })
      form.reset(values)
      setAllowLeave(false)
      showSuccess('Профиль компании обновлён')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не удалось сохранить')
    }
  })

  return (
    <Box>
      <PageHeader
        title="Редактирование компании"
        subtitle={company.shortName}
        actions={
          <AppButton component={RouterLink} to={ROUTES.COMPANY_ADMIN} variant="outlined">
            Обзор
          </AppButton>
        }
      />

      <NeedsChangesBanner entityType="company" entityId={company.id} />

      <Stack component="form" spacing={3} onSubmit={onSubmit} maxWidth={640}>
        <Section title="Юридические данные">
          <Stack spacing={2}>
            <AppInput
              label="ИНН"
              value={company.inn}
              disabled={lockedInn}
              helperText={lockedInn ? 'Заблокировано для верифицированной компании' : undefined}
            />
            <AppInput
              label="ОГРН"
              value={company.ogrn}
              disabled={lockedOgrn}
              helperText={lockedOgrn ? 'Заблокировано для верифицированной компании' : undefined}
            />
            <AppInput
              label="Полное название"
              value={company.name}
              disabled={lockedName}
              helperText={lockedName ? 'Заблокировано для верифицированной компании' : undefined}
            />
            <Controller
              name="shortName"
              control={form.control}
              render={({ field, fieldState }) => (
                <AppInput
                  {...field}
                  value={field.value ?? ''}
                  label="Короткое название"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Stack>
        </Section>

        <Section title="Описание и география">
          <Stack spacing={2}>
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <AppTextarea
                  {...field}
                  label="Описание"
                  minRows={4}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="website"
              control={form.control}
              render={({ field, fieldState }) => (
                <AppInput
                  {...field}
                  value={field.value ?? ''}
                  label="Сайт"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="region"
              control={form.control}
              render={({ field, fieldState }) => (
                <RegionAutocomplete
                  label="Регион / город"
                  value={field.value}
                  onChange={field.onChange}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Stack>
        </Section>

        <Section title="Отрасли и компетенции">
          <Stack spacing={2}>
            <Controller
              name="industries"
              control={form.control}
              render={({ field, fieldState }) => (
                <Box>
                  <CommaListInput
                    label="Отрасли (через запятую)"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    {field.value.map((t) => (
                      <Chip key={t} label={t} size="small" />
                    ))}
                  </Stack>
                </Box>
              )}
            />
            <Controller
              name="capabilities"
              control={form.control}
              render={({ field }) => (
                <CommaListInput
                  label="Компетенции (через запятую)"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            <Controller
              name="technologies"
              control={form.control}
              render={({ field, fieldState }) => (
                <CommaListInput
                  label="Технологии (через запятую)"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="services"
              control={form.control}
              render={({ field }) => (
                <CommaListInput
                  label="Услуги в профиле (через запятую)"
                  value={field.value ?? []}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </Stack>
        </Section>

        {form.formState.errors.root ? (
          <Typography color="error">{form.formState.errors.root.message}</Typography>
        ) : null}

        <AppButton type="submit" variant="contained" loading={updateProfile.isPending}>
          Сохранить
        </AppButton>
      </Stack>

      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onStay={() => blocker.reset?.()}
        onLeave={() => {
          setAllowLeave(true)
          blocker.proceed?.()
        }}
      />
    </Box>
  )
}
