import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  COMPANY_MEMBER_ROLE_LABELS,
  COMPANY_MEMBER_ROLES,
  COMPANY_MEMBER_STATUS,
  type CompanyMemberRole,
} from '@/entities/company-member'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  MemberRoleChip,
  MemberStatusChip,
  canChangeMemberRole,
  canRemoveMember,
  canSuspendMember,
  useActivateMember,
  useCompanyMember,
  useCompanyMembers,
  useRemoveMember,
  useResendMemberInvite,
  useSuspendMember,
  useUpdateMemberRole,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { TeamApiError } from '@/shared/api/teamApi'
import { companyInvitationPath, ROUTES } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import {
  AppButton,
  AppSelect,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

const ROLE_OPTIONS = Object.values(COMPANY_MEMBER_ROLES).map((role) => ({
  value: role,
  label: COMPANY_MEMBER_ROLE_LABELS[role],
}))

type ConfirmKind = 'suspend' | 'remove' | 'promote' | 'cancelInvite'

export function CompanyMemberDetailPage() {
  const { memberId = '' } = useParams()
  const navigate = useNavigate()
  const companyId = useSessionStore((s) => s.company?.id)
  const { data: member, isLoading, isError, refetch } = useCompanyMember(memberId)
  const membersQ = useCompanyMembers(companyId)
  const updateRole = useUpdateMemberRole(companyId)
  const suspend = useSuspendMember(companyId)
  const activate = useActivateMember(companyId)
  const remove = useRemoveMember(companyId)
  const resend = useResendMemberInvite(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null)
  const [pendingRole, setPendingRole] = useState<CompanyMemberRole | null>(null)

  const members = membersQ.data ?? []

  const guards = useMemo(() => {
    if (!member) return null
    return {
      suspend: canSuspendMember(members, member),
      remove: canRemoveMember(members, member),
    }
  }, [member, members])

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !member) {
    return <ErrorState onRetry={() => void refetch()} />
  }

  const handleRoleChange = async (role: CompanyMemberRole) => {
    if (role === member.role) return
    const check = canChangeMemberRole(members, member, role)
    if (!check.allowed) {
      showError(check.reason ?? 'Нельзя изменить роль')
      return
    }
    if (role === COMPANY_MEMBER_ROLES.COMPANY_ADMIN) {
      setPendingRole(role)
      setConfirm('promote')
      return
    }
    try {
      await updateRole.mutateAsync({ memberId: member.id, role })
      showSuccess('Роль обновлена')
    } catch (err) {
      showError(err instanceof TeamApiError ? err.message : 'Не удалось сменить роль')
    }
  }

  const runConfirm = async () => {
    if (!confirm) return
    try {
      if (confirm === 'suspend') {
        await suspend.mutateAsync(member.id)
        showSuccess('Доступ приостановлен')
      } else if (confirm === 'remove' || confirm === 'cancelInvite') {
        await remove.mutateAsync(member.id)
        showSuccess(confirm === 'cancelInvite' ? 'Приглашение отменено' : 'Сотрудник удалён')
        void navigate(ROUTES.PROFILE_COMPANY_TEAM)
      } else if (confirm === 'promote' && pendingRole) {
        await updateRole.mutateAsync({ memberId: member.id, role: pendingRole })
        showSuccess('Права администратора назначены')
      }
      setConfirm(null)
      setPendingRole(null)
    } catch (err) {
      showError(err instanceof TeamApiError ? err.message : 'Операция не выполнена')
      setConfirm(null)
      setPendingRole(null)
    }
  }

  const isSuspended = member.status === COMPANY_MEMBER_STATUS.SUSPENDED
  const isDeactivated = member.status === COMPANY_MEMBER_STATUS.DEACTIVATED
  const isInvited = member.status === COMPANY_MEMBER_STATUS.INVITED
  const inviteLink = `${window.location.origin}${companyInvitationPath(member.id)}`

  return (
    <Box>
      <PageHeader
        title={`${member.firstName} ${member.lastName}`}
        subtitle={member.email}
        actions={
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_TEAM} variant="outlined">
            К команде
          </AppButton>
        }
      />

      <Stack spacing={2} maxWidth={520}>
        <Stack direction="row" spacing={1} alignItems="center">
          <MemberRoleChip role={member.role} />
          <MemberStatusChip status={member.status} />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Приглашён: {formatDate(member.invitedAt)}
          {member.joinedAt ? ` · В команде с ${formatDate(member.joinedAt)}` : ''}
          {member.lastActiveAt ? ` · Активность: ${formatDate(member.lastActiveAt)}` : ''}
        </Typography>

        {isInvited ? (
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
            Ссылка-приглашение: {inviteLink}
          </Typography>
        ) : null}

        {!isDeactivated && !isInvited ? (
          <AppSelect
            label="Роль"
            options={ROLE_OPTIONS}
            value={member.role}
            onChange={(value) => void handleRoleChange(value as CompanyMemberRole)}
            disabled={
              guards?.remove.allowed === false && member.role === COMPANY_MEMBER_ROLES.COMPANY_ADMIN
            }
          />
        ) : null}

        {guards?.remove.allowed === false ? (
          <EmptyState title="Последний администратор" description={guards.remove.reason} />
        ) : null}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {isInvited ? (
            <>
              <AppButton
                variant="contained"
                loading={resend.isPending}
                onClick={() =>
                  void resend
                    .mutateAsync(member.id)
                    .then(() => showSuccess('Приглашение отправлено повторно'))
                    .catch((err) =>
                      showError(
                        err instanceof TeamApiError ? err.message : 'Не удалось отправить',
                      ),
                    )
                }
              >
                Отправить повторно
              </AppButton>
              <AppButton
                color="error"
                variant="outlined"
                onClick={() => setConfirm('cancelInvite')}
              >
                Отменить приглашение
              </AppButton>
              <AppButton
                variant="text"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteLink).then(
                    () => showSuccess('Ссылка скопирована'),
                    () => showError('Не удалось скопировать'),
                  )
                }}
              >
                Копировать ссылку
              </AppButton>
            </>
          ) : null}
          {isSuspended && !isDeactivated ? (
            <AppButton
              variant="outlined"
              onClick={() =>
                void activate.mutateAsync(member.id).then(() => showSuccess('Доступ восстановлен'))
              }
              loading={activate.isPending}
            >
              Восстановить доступ
            </AppButton>
          ) : null}
          {!isSuspended && !isDeactivated && !isInvited ? (
            <AppButton
              color="warning"
              disabled={!guards?.suspend.allowed}
              onClick={() => setConfirm('suspend')}
            >
              Приостановить доступ
            </AppButton>
          ) : null}
          {!isDeactivated && !isInvited ? (
            <AppButton
              color="error"
              disabled={!guards?.remove.allowed}
              onClick={() => setConfirm('remove')}
            >
              Удалить из команды
            </AppButton>
          ) : null}
        </Stack>
      </Stack>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm === 'remove'
            ? 'Удалить сотрудника?'
            : confirm === 'cancelInvite'
              ? 'Отменить приглашение?'
              : confirm === 'promote'
                ? 'Назначить администратором?'
                : 'Приостановить доступ?'
        }
        description={
          confirm === 'promote'
            ? `${member.firstName} ${member.lastName} получит полный доступ к управлению компанией.`
            : `${member.firstName} ${member.lastName} (${member.email})`
        }
        confirmLabel={
          confirm === 'remove'
            ? 'Удалить'
            : confirm === 'cancelInvite'
              ? 'Отменить'
              : confirm === 'promote'
                ? 'Назначить'
                : 'Приостановить'
        }
        destructive={confirm !== 'promote'}
        loading={suspend.isPending || remove.isPending || updateRole.isPending}
        onCancel={() => {
          setConfirm(null)
          setPendingRole(null)
        }}
        onConfirm={() => void runConfirm()}
      />
    </Box>
  )
}
