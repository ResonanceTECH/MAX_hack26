import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  COMPANY_MEMBER_ROLE_LABELS,
  COMPANY_MEMBER_STATUS,
} from '@/entities/company-member'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { MemberRoleChip, MemberStatusChip } from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { companyInvitationsApi } from '@/shared/api/companyInvitationsApi'
import { ROUTES } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import { AppButton, ErrorState, LoadingState, PageHeader } from '@/shared/ui'

export function CompanyInvitationAcceptPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const initSession = useSessionStore((s) => s.initSession)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [action, setAction] = useState<'accept' | 'decline' | null>(null)

  const invitationQ = useQuery({
    queryKey: ['company-invitation', id],
    queryFn: () => companyInvitationsApi.getById(id),
    enabled: Boolean(id),
  })

  const accept = useMutation({
    mutationFn: () => companyInvitationsApi.accept(id),
    onSuccess: async () => {
      await initSession()
      void qc.invalidateQueries({ queryKey: ['company-management'] })
      showSuccess('Вы вступили в команду')
      void navigate(ROUTES.HOME)
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : 'Не удалось принять')
    },
    onSettled: () => setAction(null),
  })

  const decline = useMutation({
    mutationFn: () => companyInvitationsApi.decline(id),
    onSuccess: () => {
      showSuccess('Приглашение отклонено')
      void navigate(ROUTES.HOME)
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : 'Не удалось отклонить')
    },
    onSettled: () => setAction(null),
  })

  if (invitationQ.isLoading) return <LoadingState variant="page" />
  if (invitationQ.isError || !invitationQ.data) {
    return <ErrorState onRetry={() => void invitationQ.refetch()} />
  }

  const inv = invitationQ.data
  const pending = inv.status === COMPANY_MEMBER_STATUS.INVITED
  const roleLabel = COMPANY_MEMBER_ROLE_LABELS[inv.role] ?? inv.role

  return (
    <Box>
      <PageHeader title="Приглашение в команду" subtitle="Подтвердите или отклоните участие" />

      <Stack spacing={2} maxWidth={480}>
        <Typography variant="h2">Вас приглашают в {inv.companyName}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body1">Роль: {roleLabel}</Typography>
          <MemberRoleChip role={inv.role} />
          <MemberStatusChip status={inv.status} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {inv.firstName} {inv.lastName} · {inv.email}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Приглашение отправлено: {formatDate(inv.invitedAt)}
        </Typography>

        {pending ? (
          <Stack direction="row" spacing={1}>
            <AppButton
              variant="contained"
              loading={action === 'accept' && accept.isPending}
              disabled={decline.isPending}
              onClick={() => {
                setAction('accept')
                void accept.mutateAsync()
              }}
            >
              Принять
            </AppButton>
            <AppButton
              variant="outlined"
              color="error"
              loading={action === 'decline' && decline.isPending}
              disabled={accept.isPending}
              onClick={() => {
                setAction('decline')
                void decline.mutateAsync()
              }}
            >
              Отклонить
            </AppButton>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Это приглашение уже обработано.
          </Typography>
        )}
      </Stack>
    </Box>
  )
}
