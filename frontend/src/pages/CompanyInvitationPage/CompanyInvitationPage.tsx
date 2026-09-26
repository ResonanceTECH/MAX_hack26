import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { COMPANY_MEMBER_ROLE_LABELS } from '@/entities/company-member'
import { MemberRoleChip } from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { teamApi } from '@/shared/api/teamApi'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton, ErrorState, LoadingState, PageHeader } from '@/shared/ui'

export function CompanyInvitationPage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const showError = useSnackbarStore((s) => s.showError)
  const [doneStatus, setDoneStatus] = useState<'accepted' | 'declined' | null>(null)
  const [joinedCompany, setJoinedCompany] = useState<string | null>(null)

  const invitationQ = useQuery({
    queryKey: ['company-invitation', token],
    queryFn: () => teamApi.getInvitationByToken(token),
    enabled: Boolean(token),
  })

  const accept = useMutation({
    mutationFn: () => teamApi.acceptInvitation(token),
    onSuccess: (inv) => {
      setJoinedCompany(inv.companyName)
      setDoneStatus('accepted')
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : 'Не удалось принять')
    },
  })

  const decline = useMutation({
    mutationFn: () => teamApi.declineInvitation(token),
    onSuccess: () => {
      setDoneStatus('declined')
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : 'Не удалось отклонить')
    },
  })

  if (invitationQ.isLoading) return <LoadingState variant="page" />
  if (invitationQ.isError || !invitationQ.data) {
    return <ErrorState onRetry={() => void invitationQ.refetch()} />
  }

  const inv = invitationQ.data
  const status = doneStatus ?? inv.status

  if (status === 'accepted') {
    const company = joinedCompany ?? inv.companyName
    return (
      <Box>
        <PageHeader title="Приглашение принято" />
        <Stack spacing={2} maxWidth={480}>
          <Typography variant="h2">Вы присоединились к {company}</Typography>
          <AppButton variant="contained" onClick={() => void navigate(ROUTES.HOME)}>
            Перейти к работе
          </AppButton>
        </Stack>
      </Box>
    )
  }

  if (status === 'declined') {
    return (
      <Box>
        <PageHeader title="Приглашение отклонено" />
        <Typography variant="body1" color="text.secondary">
          Вы отклонили приглашение в {inv.companyName}.
        </Typography>
      </Box>
    )
  }

  if (status === 'expired' || status === 'cancelled') {
    return (
      <Box>
        <PageHeader title="Приглашение недействительно" />
        <Stack spacing={2} maxWidth={480}>
          <Typography variant="body1">Приглашение больше недействительно.</Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader title="Приглашение в команду" subtitle="Подтвердите или отклоните участие" />
      <Stack spacing={2} maxWidth={480}>
        <Typography variant="h2">Вас приглашают в {inv.companyName}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body1">
            Роль: {COMPANY_MEMBER_ROLE_LABELS[inv.role]}
          </Typography>
          <MemberRoleChip role={inv.role} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Пригласил: {inv.invitedBy || '—'}
        </Typography>
        <Stack direction="row" spacing={1}>
          <AppButton
            variant="contained"
            loading={accept.isPending}
            disabled={decline.isPending}
            onClick={() => void accept.mutateAsync()}
          >
            Принять
          </AppButton>
          <AppButton
            variant="outlined"
            color="error"
            loading={decline.isPending}
            disabled={accept.isPending}
            onClick={() => void decline.mutateAsync()}
          >
            Отклонить
          </AppButton>
        </Stack>
      </Stack>
    </Box>
  )
}

/** @deprecated alias */
export const CompanyInvitationAcceptPage = CompanyInvitationPage
