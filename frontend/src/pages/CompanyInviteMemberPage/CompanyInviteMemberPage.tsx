import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import {
  COMPANY_MEMBER_ROLE_LABELS,
  COMPANY_MEMBER_ROLES,
} from '@/entities/company-member'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  inviteMemberSchema,
  type InviteMemberFormValues,
  useInviteMember,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton, AppInput, AppSelect, AppTextarea, PageHeader } from '@/shared/ui'

const ROLE_OPTIONS = [
  COMPANY_MEMBER_ROLES.MANAGER,
  COMPANY_MEMBER_ROLES.VIEWER,
  COMPANY_MEMBER_ROLES.COMPANY_ADMIN,
].map((role) => ({
  value: role,
  label: COMPANY_MEMBER_ROLE_LABELS[role],
}))

export function CompanyInviteMemberPage() {
  const navigate = useNavigate()
  const companyId = useSessionStore((s) => s.company?.id)
  const invite = useInviteMember(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: COMPANY_MEMBER_ROLES.MANAGER,
      optionalMessage: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await invite.mutateAsync(values)
      showSuccess('Приглашение отправлено')
      void navigate(ROUTES.PROFILE_COMPANY_TEAM)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка приглашения')
    }
  })

  return (
    <Box>
      <PageHeader
        title="Пригласить сотрудника"
        subtitle="Отправьте приглашение по email"
        actions={
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_TEAM} variant="outlined">
            К команде
          </AppButton>
        }
      />

      <Stack component="form" spacing={2} maxWidth={480} onSubmit={onSubmit}>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <AppInput
              {...field}
              label="Email"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="firstName"
          control={form.control}
          render={({ field, fieldState }) => (
            <AppInput
              {...field}
              label="Имя"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="lastName"
          control={form.control}
          render={({ field, fieldState }) => (
            <AppInput
              {...field}
              label="Фамилия"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="role"
          control={form.control}
          render={({ field }) => (
            <AppSelect
              label="Роль"
              options={ROLE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="optionalMessage"
          control={form.control}
          render={({ field, fieldState }) => (
            <AppTextarea
              {...field}
              value={field.value ?? ''}
              label="Сообщение (необязательно)"
              minRows={3}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <AppButton type="submit" variant="contained" loading={invite.isPending}>
          Отправить приглашение
        </AppButton>
      </Stack>
    </Box>
  )
}
