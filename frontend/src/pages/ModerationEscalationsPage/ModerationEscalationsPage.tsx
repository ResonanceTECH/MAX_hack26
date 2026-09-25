import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEscalations } from '@/features/moderation/api/queries'
import { ESCALATION_REASON_LABELS } from '@/features/moderation/model/labels'
import { formatDate } from '@/shared/lib/format'
import { moderationItemPath, ROUTES } from '@/shared/constants/routes'
import { AppButton, EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui'

export function ModerationEscalationsPage() {
  const query = useEscalations()

  return (
    <Box>
      <PageHeader
        title="Эскалации"
        subtitle="Случаи, переданные Platform Admin"
      />
      {query.isLoading ? <LoadingState variant="list" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError && (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="Нет эскалированных случаев." description="Сложные кейсы появятся здесь." />
      ) : null}
      <Stack spacing={1.5}>
        {(query.data ?? []).map((esc) => (
          <Card key={esc.id} variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={esc.status} />
                <Chip
                  size="small"
                  variant="outlined"
                  label={ESCALATION_REASON_LABELS[esc.reason]}
                />
              </Stack>
              <Typography variant="h4">{esc.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {esc.companyName} · {esc.moderatorName} · {formatDate(esc.createdAt)}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {esc.comment}
              </Typography>
              {esc.adminResponse ? (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  Ответ админа: {esc.adminResponse}
                </Typography>
              ) : null}
              <AppButton
                component={RouterLink}
                to={moderationItemPath(esc.entityType, esc.moderationItemId)}
                size="small"
                sx={{ mt: 1 }}
              >
                Открыть объект
              </AppButton>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <AppButton component={RouterLink} to={ROUTES.MODERATION} variant="text" sx={{ mt: 2 }}>
        К обзору
      </AppButton>
    </Box>
  )
}
