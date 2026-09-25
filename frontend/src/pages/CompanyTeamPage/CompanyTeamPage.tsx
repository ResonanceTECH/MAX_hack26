import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import {
  COMPANY_MEMBER_ROLE_LABELS,
  COMPANY_MEMBER_ROLES,
  COMPANY_MEMBER_STATUS,
  type CompanyMember,
  type CompanyMemberRole,
} from '@/entities/company-member'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  useBlockMember,
  useCompanyMembers,
  useInviteMember,
  useRemoveMember,
  useUpdateMemberRole,
} from '@/features/company-management/api/queries'
import {
  inviteMemberSchema,
  type InviteMemberFormValues,
} from '@/features/company-management/model/schemas'
import { Permission } from '@/features/permissions'
import { usePermission } from '@/features/permissions/hooks/usePermission'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { TeamApiError } from '@/shared/api/teamApi'
import { ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppInput,
  AppSelect,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

const STATUS_LABELS: Record<string, string> = {
  active: 'Активен',
  blocked: 'Заблокирован',
  invited: 'Приглашён',
}

const ROLE_OPTIONS = Object.values(COMPANY_MEMBER_ROLES).map((role) => ({
  value: role,
  label: COMPANY_MEMBER_ROLE_LABELS[role],
}))

type ConfirmAction = { type: 'block' | 'remove'; member: CompanyMember }

export function CompanyTeamPage() {
  const companyId = useSessionStore((s) => s.company?.id)
  const canManage = usePermission(Permission.MANAGE_COMPANY_MEMBERS)
  const { data, isLoading, isError, refetch } = useCompanyMembers(companyId)
  const invite = useInviteMember(companyId)
  const updateRole = useUpdateMemberRole(companyId)
  const block = useBlockMember(companyId)
  const remove = useRemoveMember(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)

  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: COMPANY_MEMBER_ROLES.MANAGER,
    },
  })

  const adminCount = useMemo(
    () =>
      data?.filter(
        (m) =>
          m.role === COMPANY_MEMBER_ROLES.COMPANY_ADMIN &&
          m.status !== COMPANY_MEMBER_STATUS.BLOCKED,
      ).length ?? 0,
    [data],
  )

  if (!canManage) {
    return <EmptyState title="Нет доступа" description="Управление командой недоступно." />
  }

  const handleInvite = form.handleSubmit(async (values) => {
    try {
      await invite.mutateAsync(values)
      showSuccess('Приглашение отправлено')
      setInviteOpen(false)
      form.reset()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка приглашения')
    }
  })

  const handleRoleChange = async (member: CompanyMember, role: CompanyMemberRole) => {
    try {
      await updateRole.mutateAsync({ memberId: member.id, role })
      showSuccess('Роль обновлена')
    } catch (err) {
      const msg =
        err instanceof TeamApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Не удалось сменить роль'
      showError(msg)
    }
  }

  const runConfirm = async () => {
    if (!confirm) return
    try {
      if (confirm.type === 'block') {
        await block.mutateAsync(confirm.member.id)
        showSuccess('Сотрудник заблокирован')
      } else {
        await remove.mutateAsync(confirm.member.id)
        showSuccess('Сотрудник удалён')
      }
      setConfirm(null)
    } catch (err) {
      const msg =
        err instanceof TeamApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Операция не выполнена'
      showError(msg)
      setConfirm(null)
    }
  }

  return (
    <Box>
      <PageHeader
        title="Команда"
        subtitle="Сотрудники и роли в компании"
        actions={
          <Stack direction="row" spacing={1}>
            <AppButton component={RouterLink} to={ROUTES.COMPANY_ADMIN} variant="outlined">
              Назад
            </AppButton>
            <AppButton variant="contained" onClick={() => setInviteOpen(true)}>
              Пригласить
            </AppButton>
          </Stack>
        }
      />

      {isLoading ? <LoadingState variant="list" /> : null}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && data?.length === 0 ? (
        <EmptyState
          title="Пока нет сотрудников"
          description="Пригласите коллег, чтобы совместная работа началась."
          actionLabel="Пригласить"
          onAction={() => setInviteOpen(true)}
        />
      ) : null}

      {data && data.length > 0 ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Сотрудник</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((member) => {
              const isLastAdmin =
                member.role === COMPANY_MEMBER_ROLES.COMPANY_ADMIN &&
                member.status !== COMPANY_MEMBER_STATUS.BLOCKED &&
                adminCount <= 1
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    {member.firstName} {member.lastName}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <AppSelect
                      label="Роль"
                      size="small"
                      options={ROLE_OPTIONS}
                      value={member.role}
                      onChange={(value) => void handleRoleChange(member, value as CompanyMemberRole)}
                      disabled={isLastAdmin}
                      sx={{ minWidth: 160 }}
                    />
                    {isLastAdmin ? (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Последний администратор
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={STATUS_LABELS[member.status] ?? member.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {member.status !== COMPANY_MEMBER_STATUS.BLOCKED ? (
                        <AppButton
                          size="small"
                          color="warning"
                          disabled={isLastAdmin}
                          onClick={() => setConfirm({ type: 'block', member })}
                        >
                          Блок
                        </AppButton>
                      ) : null}
                      <AppButton
                        size="small"
                        color="error"
                        disabled={isLastAdmin}
                        onClick={() => setConfirm({ type: 'remove', member })}
                      >
                        Удалить
                      </AppButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : null}

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Пригласить сотрудника</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton onClick={() => setInviteOpen(false)}>Отмена</AppButton>
          <AppButton variant="contained" loading={invite.isPending} onClick={() => void handleInvite()}>
            Отправить
          </AppButton>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === 'remove' ? 'Удалить сотрудника?' : 'Заблокировать сотрудника?'}
        description={
          confirm
            ? `${confirm.member.firstName} ${confirm.member.lastName} (${confirm.member.email})`
            : undefined
        }
        confirmLabel={confirm?.type === 'remove' ? 'Удалить' : 'Заблокировать'}
        destructive
        loading={block.isPending || remove.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirm()}
      />
    </Box>
  )
}
