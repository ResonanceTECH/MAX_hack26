import { useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useNotificationsStore } from '@/features/notifications/model/notificationsStore'
import { formatRelativeDate } from '@/shared/lib/format'
import { AppButton, EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui'

export function NotificationsPage() {
  const items = useNotificationsStore((s) => s.items)
  const isLoading = useNotificationsStore((s) => s.isLoading)
  const error = useNotificationsStore((s) => s.error)
  const fetchAll = useNotificationsStore((s) => s.fetchAll)
  const markAsRead = useNotificationsStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead)

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  return (
    <Box>
      <PageHeader
        title="Уведомления"
        actions={
          <AppButton variant="text" size="small" onClick={() => void markAllAsRead()}>
            Прочитать все
          </AppButton>
        }
      />
      {isLoading ? <LoadingState rows={4} variant="list" /> : null}
      {error ? <ErrorState onRetry={() => void fetchAll()} /> : null}
      {!isLoading && !error && items.length === 0 ? <EmptyState title="Нет уведомлений" /> : null}
      <Stack spacing={1.5}>
        {items.map((item) => (
          <Card
            key={item.id}
            sx={{
              bgcolor: item.read ? 'background.paper' : 'match.light',
              borderColor: item.read ? 'divider' : 'secondary.light',
            }}
          >
            <CardActionArea
              component={item.link ? RouterLink : 'div'}
              to={item.link}
              onClick={() => {
                if (!item.read) void markAsRead(item.id)
              }}
            >
              <CardContent>
                <Typography variant="h4">{item.title}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {item.message}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {formatRelativeDate(item.createdAt)}
                  {!item.read ? ' · новое' : ''}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
