import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import type { ModerationEntityType } from '@/entities/moderation'
import { useModerationQueue } from '@/features/moderation/api/queries'
import {
  MODERATION_STATUS_LABELS,
  MODERATION_TYPE_LABELS,
} from '@/features/moderation/model/labels'
import { formatRelativeDate } from '@/shared/lib/format'
import { moderationItemPath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SearchInput,
} from '@/shared/ui'

type TabKey = 'all' | ModerationEntityType

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'company', label: 'Компании' },
  { key: 'opportunity', label: 'Запросы' },
  { key: 'case', label: 'Кейсы' },
  { key: 'document', label: 'Документы' },
]

export function ModerationQueuePage() {
  const [tab, setTab] = useState<TabKey>('all')
  const [query, setQuery] = useState('')

  const filters = useMemo(
    () => ({
      type: tab === 'all' ? ('all' as const) : tab,
      status: 'pending' as const,
      query: query || undefined,
    }),
    [tab, query],
  )

  const queueQuery = useModerationQueue(filters)
  const items = queueQuery.data ?? []

  return (
    <Box>
      <PageHeader
        title="Очередь модерации"
        subtitle="Заявки, ожидающие проверки"
        actions={
          <AppButton component={RouterLink} to={ROUTES.MODERATION} variant="text">
            К сводке
          </AppButton>
        }
      />

      <Tabs
        value={tab}
        onChange={(_, value: TabKey) => setTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        {TABS.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} />
        ))}
      </Tabs>

      <Box sx={{ mb: 2, maxWidth: 420 }}>
        <SearchInput value={query} onChange={setQuery} placeholder="Поиск по названию или компании" />
      </Box>

      {queueQuery.isLoading ? <LoadingState rows={4} variant="list" /> : null}
      {queueQuery.isError ? <ErrorState onRetry={() => void queueQuery.refetch()} /> : null}
      {!queueQuery.isLoading && !queueQuery.isError && items.length === 0 ? (
        <EmptyState title="Ничего не найдено" description="В этой вкладке нет ожидающих заявок" />
      ) : null}

      <Stack spacing={1.5}>
        {items.map((item) => (
          <Card key={item.id} variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={1.5}
                alignItems={{ sm: 'center' }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={MODERATION_TYPE_LABELS[item.type]} />
                    <Chip
                      size="small"
                      label={MODERATION_STATUS_LABELS[item.status]}
                      color="warning"
                    />
                  </Stack>
                  <Typography variant="h4">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {item.summary}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {item.companyName} · {item.authorName} · {formatRelativeDate(item.submittedAt)}
                  </Typography>
                </Box>
                <AppButton
                  component={RouterLink}
                  to={moderationItemPath(item.type, item.id)}
                  variant="contained"
                >
                  Проверить
                </AppButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
