import { Link as RouterLink, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMatch } from '@/entities/match/api/queries'
import { useProposal, useRejectProposal, useShortlistProposal } from '@/entities/proposal/api/queries'
import { Permission } from '@/features/permissions/model/permissions'
import { useCompanyPermission } from '@/features/permissions/hooks/useCompanyPermission'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { EntityActionsMenu } from '@/features/reports'
import { companyDetailsPath } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import {
  AppButton,
  BentoGrid,
  BentoTile,
  CompanyAvatar,
  ErrorState,
  LoadingState,
  MatchExplanationFromMatch,
  MoneyValue,
  PageHeader,
  StatusChip,
  Tag,
  VerifiedBadge,
} from '@/shared/ui'

export function ProposalDetailsPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, refetch } = useProposal(id)
  const matchQuery = useMatch(data?.opportunityId ?? '', data?.company.id ?? '')
  const shortlistMutation = useShortlistProposal()
  const rejectMutation = useRejectProposal()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const canManageShortlist = useCompanyPermission(Permission.MANAGE_SHORTLIST)

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const match = matchQuery.data
  const actionsDisabled =
    !canManageShortlist ||
    data.status === 'rejected' ||
    data.status === 'shortlisted' ||
    shortlistMutation.isPending ||
    rejectMutation.isPending

  return (
    <Box sx={{ pb: { xs: 10, md: 0 } }}>
      <PageHeader
        title={data.company.shortName}
        subtitle={`Предложение от ${formatDate(data.createdAt)}`}
        actions={<StatusChip status={data.status} kind="proposal" />}
      />

      <BentoGrid>
        <BentoTile span={8} variant="emphasis">
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <CompanyAvatar
              name={data.company.shortName}
              logoUrl={data.company.logoUrl}
              size={56}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h3">{data.company.name}</Typography>
                <VerifiedBadge verified={data.company.verified} compact />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {data.company.region}
              </Typography>
            </Box>
            <EntityActionsMenu
              targetType="proposal"
              targetId={data.id}
              targetName={data.company.shortName}
              shareTitle={`Предложение ${data.company.shortName}`}
              shareText={data.description}
              hideFavorite
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <MoneyValue amount={data.price} currency={data.currency} variant="h3" />
            <Typography variant="body1" fontWeight={600} color="text.secondary">
              Срок: {data.durationDays} дн.
            </Typography>
          </Stack>
          <Typography variant="h4" sx={{ mb: 0.75 }}>
            Описание
          </Typography>
          <Typography variant="body1">{data.description}</Typography>
        </BentoTile>

        <BentoTile span={4}>
          {match ? (
            <Box sx={{ mb: 2 }}>
              <MatchExplanationFromMatch match={match} companyName={data.company.shortName} />
            </Box>
          ) : null}
          <AppButton
            component={RouterLink}
            to={`${companyDetailsPath(data.company.id)}?fromOpportunity=${data.opportunityId}`}
            variant="outlined"
            fullWidth
            sx={{ minHeight: 44 }}
          >
            Профиль компании
          </AppButton>
          {canManageShortlist ? (
            <Stack
              direction="column"
              spacing={1}
              sx={{ display: { xs: 'none', md: 'flex' }, mt: 1.5 }}
            >
              <AppButton
                variant="contained"
                loading={shortlistMutation.isPending}
                disabled={actionsDisabled}
                onClick={() =>
                  shortlistMutation.mutate(id, {
                    onSuccess: () => showSuccess('Добавлено в шортлист'),
                  })
                }
              >
                В шортлист
              </AppButton>
              <AppButton
                variant="outlined"
                color="error"
                loading={rejectMutation.isPending}
                disabled={actionsDisabled}
                onClick={() => rejectMutation.mutate(id)}
              >
                Отклонить
              </AppButton>
            </Stack>
          ) : null}
        </BentoTile>

        <BentoTile span={6}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Включено
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {data.included.map((item) => (
              <Tag key={item} label={item} color="secondary" />
            ))}
          </Stack>
        </BentoTile>

        <BentoTile span={6}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Не включено
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {data.excluded.map((item) => (
              <Tag key={item} label={item} />
            ))}
          </Stack>
        </BentoTile>

        <BentoTile span={12}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Релевантные кейсы
          </Typography>
          <Stack spacing={0.75}>
            {data.cases.map((c) => (
              <Typography key={c} variant="body1">
                · {c}
              </Typography>
            ))}
          </Stack>
        </BentoTile>
      </BentoGrid>

      {canManageShortlist ? (
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 'calc(64px + env(safe-area-inset-bottom))',
            zIndex: 10,
            p: 2,
            gap: 1,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <AppButton
            fullWidth
            variant="contained"
            loading={shortlistMutation.isPending}
            disabled={actionsDisabled}
            onClick={() =>
              shortlistMutation.mutate(id, {
                onSuccess: () => showSuccess('Добавлено в шортлист'),
              })
            }
          >
            В шортлист
          </AppButton>
          <AppButton
            fullWidth
            variant="outlined"
            color="error"
            loading={rejectMutation.isPending}
            disabled={actionsDisabled}
            onClick={() => rejectMutation.mutate(id)}
          >
            Отклонить
          </AppButton>
        </Box>
      ) : null}
    </Box>
  )
}
