import { useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useUpdateCompanyProfile } from '@/features/company-management/api/queries'
import {
  companyProfileSchema,
  type CompanyProfileFormValues,
} from '@/features/company-management/model/schemas'
import { Permission } from '@/features/permissions'
import { usePermission } from '@/features/permissions/hooks/usePermission'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppInput,
  AppTextarea,
  EmptyState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function CompanyEditPage() {
  const company = useSessionStore((s) => s.company)
  const canEdit = usePermission(Permission.EDIT_COMPANY)
  const updateProfile = useUpdateCompanyProfile(company?.id)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

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
    })
  }, [company, form])

  if (!canEdit) {
    return (
      <EmptyState title="Нет доступа" description="Редактирование профиля недоступно." />
    )
  }

  if (!company) return <LoadingState variant="page" />

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
      })
      // keep session company in sync
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
        },
      })
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
            Назад
          </AppButton>
        }
      />

      <Stack component="form" spacing={2.5} onSubmit={onSubmit} maxWidth={640}>
        <AppInput label="ИНН" value={company.inn} disabled helperText="Только для чтения" />
        <AppInput label="ОГРН" value={company.ogrn} disabled helperText="Только для чтения" />
        <AppInput label="Название" value={company.name} disabled />

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
            <AppInput
              {...field}
              label="Регион"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="industries"
          control={form.control}
          render={({ field, fieldState }) => (
            <Box>
              <AppInput
                label="Отрасли (через запятую)"
                value={field.value.join(', ')}
                onChange={(e) => field.onChange(parseTags(e.target.value))}
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
            <AppInput
              label="Компетенции (через запятую)"
              value={field.value.join(', ')}
              onChange={(e) => field.onChange(parseTags(e.target.value))}
            />
          )}
        />

        <Controller
          name="technologies"
          control={form.control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Технологии (через запятую)"
              value={field.value.join(', ')}
              onChange={(e) => field.onChange(parseTags(e.target.value))}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="services"
          control={form.control}
          render={({ field }) => (
            <AppInput
              label="Услуги в профиле (через запятую)"
              value={(field.value ?? []).join(', ')}
              onChange={(e) => field.onChange(parseTags(e.target.value))}
            />
          )}
        />

        {form.formState.errors.root ? (
          <Typography color="error">{form.formState.errors.root.message}</Typography>
        ) : null}

        <AppButton type="submit" variant="contained" loading={updateProfile.isPending}>
          Сохранить
        </AppButton>
      </Stack>
    </Box>
  )
}
