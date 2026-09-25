import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ModerationItem } from '@/entities/moderation'
import { MODERATION_REASON_LABELS, MODERATION_TYPE_LABELS } from '../model/labels'
import { moderationItemPath } from '@/shared/constants/routes'
import { AppButton } from '@/shared/ui'
import { BaseUiMenu } from '@/features/company-management/ui/BaseUiMenu'
import { ModerationPriorityChip } from './ModerationPriorityChip'
import { ModerationStatusChip } from './ModerationStatusChip'
import { QueueAgeLabel } from './QueueAgeLabel'

export function ModerationQueueCard({
  item,
  onAssign,
  onEscalate,
}: {
  item: ModerationItem
  onAssign?: () => void
  onEscalate?: () => void
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1.5}
          alignItems={{ sm: 'center' }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 0.75 }} flexWrap="wrap" useFlexGap>
              <Typography variant="overline" color="text.secondary">
                {MODERATION_TYPE_LABELS[item.entityType]}
              </Typography>
              <ModerationStatusChip status={item.status} />
              <ModerationPriorityChip priority={item.priority} />
              {item.reportsCount > 0 ? (
                <Typography variant="caption" color="error.main">
                  Жалоб: {item.reportsCount}
                </Typography>
              ) : null}
            </Stack>
            <Typography variant="h4">{item.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {item.companyName} · {MODERATION_REASON_LABELS[item.reason]}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <QueueAgeLabel submittedAt={item.submittedAt} />
            </Box>
            {item.assignedModeratorName && item.status === 'IN_REVIEW' ? (
              <Typography variant="body2" color="primary.main" sx={{ mt: 0.5 }}>
                Проверяет: {item.assignedModeratorName}
              </Typography>
            ) : null}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <AppButton
              component={RouterLink}
              to={moderationItemPath(item.entityType, item.id)}
              variant="contained"
            >
              Проверить
            </AppButton>
            <BaseUiMenu
              aria-label="Действия с объектом"
              items={[
                {
                  key: 'open',
                  label: 'Открыть',
                  onClick: () => {
                    window.location.assign(moderationItemPath(item.entityType, item.id))
                  },
                },
                {
                  key: 'assign',
                  label: 'Взять в работу',
                  onClick: onAssign,
                  disabled: !onAssign || item.status === 'IN_REVIEW',
                },
                {
                  key: 'escalate',
                  label: 'Эскалировать',
                  onClick: onEscalate,
                  disabled: !onEscalate,
                  separatorBefore: true,
                },
              ]}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
