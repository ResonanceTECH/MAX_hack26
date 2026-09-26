import { useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import type { DealEvent, DealFile } from '@/entities/deal'
import { useDeal } from '@/entities/deal/api/queries'
import { useOpportunity } from '@/entities/opportunity/api/queries'
import { useProposal } from '@/entities/proposal/api/queries'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { apiClient } from '@/shared/api/apiClient'
import { proposalDetailsPath } from '@/shared/constants/routes'
import { formatDate, formatRelativeDate } from '@/shared/lib/format'
import { getMaxBridge } from '@/shared/lib/max'
import {
  AppButton,
  AppIcon,
  EmptyState,
  ErrorState,
  LoadingState,
  MoneyValue,
  PageHeader,
  Section,
  StatusChip,
} from '@/shared/ui'
import {
  Bookmark02Icon,
  BubbleChatIcon,
  CheckmarkCircle01Icon,
  File02Icon,
  Message01Icon,
  SentIcon,
} from '@/shared/ui/icons'

const TABS = ['Обзор', 'Предложение', 'Файлы', 'История'] as const

function eventIcon(type: DealEvent['type']) {
  switch (type) {
    case 'proposal':
      return SentIcon
    case 'shortlist':
      return Bookmark02Icon
    case 'negotiation':
      return BubbleChatIcon
    case 'message':
      return Message01Icon
    case 'status':
      return CheckmarkCircle01Icon
    default:
      return Message01Icon
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

async function downloadDealFile(file: DealFile): Promise<void> {
  const { data } = await apiClient.get<Blob>(`/files/${file.id}`, { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.name
  anchor.click()
  URL.revokeObjectURL(url)
}

export function DealRoomPage() {
  const { id = '' } = useParams()
  const [tab, setTab] = useState(0)
  const dealQuery = useDeal(id)
  const opportunityQuery = useOpportunity(dealQuery.data?.opportunityId ?? '')
  const proposalQuery = useProposal(dealQuery.data?.proposalId ?? '')
  const showInfo = useSnackbarStore((s) => s.showInfo)
  const showError = useSnackbarStore((s) => s.showError)

  if (dealQuery.isLoading) return <LoadingState variant="page" />
  if (dealQuery.isError || !dealQuery.data) {
    return <ErrorState onRetry={() => void dealQuery.refetch()} />
  }

  const deal = dealQuery.data
  const buyerName = opportunityQuery.data?.company.shortName ?? 'Заказчик'
  const headerTitle = `${deal.companyName} × ${buyerName}`
  const files = deal.files ?? []

  return (
    <Box>
      <PageHeader
        title={headerTitle}
        subtitle={deal.opportunityTitle}
        actions={<StatusChip status={deal.status} kind="deal" />}
      />

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      {tab === 0 ? (
        <Stack spacing={3}>
          <Section title="Сделка">
            <Stack spacing={1.25}>
              <Row label="Заказчик" value={buyerName} />
              <Row label="Исполнитель" value={deal.companyName} />
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                  Стоимость
                </Typography>
                <MoneyValue amount={deal.price} currency={deal.currency} variant="body1" />
              </Stack>
              <Row
                label="Срок"
                value={deal.durationDays != null ? `${deal.durationDays} дн.` : 'не указан'}
              />
              <Row label="Контакт" value={deal.contactName} />
              <Row label="Следующий шаг" value={deal.nextAction} />
              <Row label="Последнее действие" value={deal.lastAction} />
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                  Статус
                </Typography>
                <StatusChip status={deal.status} kind="deal" />
              </Stack>
            </Stack>
          </Section>
          <AppButton
            variant="contained"
            onClick={() => {
              void (async () => {
                try {
                  const bridge = getMaxBridge()
                  const result = await bridge.openChat({
                    dealId: deal.id,
                    title: headerTitle,
                    url: window.location.href,
                  })
                  if (result.mode === 'clipboard') {
                    showInfo('Ссылка на сделку скопирована — откройте чат в MAX')
                  } else if (result.mode === 'share') {
                    showInfo('Поделитесь ссылкой в MAX, чтобы продолжить чат')
                  } else if (result.mode === 'noop') {
                    showInfo('Чат MAX недоступен в этом окружении')
                  }
                } catch (err) {
                  showError(err instanceof Error ? err.message : 'Не удалось открыть чат')
                }
              })()
            }}
          >
            Открыть чат в MAX
          </AppButton>
        </Stack>
      ) : null}

      {tab === 1 ? (
        <Box>
          {!deal.proposalId ? (
            <EmptyState
              title="Предложение не привязано"
              description="Для этой сделки пока нет связанного коммерческого предложения."
            />
          ) : proposalQuery.isLoading ? (
            <LoadingState rows={2} />
          ) : proposalQuery.isError || !proposalQuery.data ? (
            <ErrorState onRetry={() => void proposalQuery.refetch()} />
          ) : (
            <Stack spacing={2}>
              <Typography variant="body1">{proposalQuery.data.description}</Typography>
              <Stack direction="row" spacing={2} alignItems="baseline">
                <MoneyValue
                  amount={proposalQuery.data.price}
                  currency={proposalQuery.data.currency}
                />
                <Typography variant="body2" color="text.secondary">
                  {proposalQuery.data.durationDays} дн.
                </Typography>
              </Stack>
              <AppButton
                component={RouterLink}
                to={proposalDetailsPath(deal.proposalId)}
                variant="outlined"
              >
                Открыть полное предложение
              </AppButton>
            </Stack>
          )}
        </Box>
      ) : null}

      {tab === 2 ? (
        files.length === 0 ? (
          <EmptyState
            title="Файлов пока нет"
            description="Договоры, NDA и приложения появятся здесь, когда стороны загрузят их в сделку."
          />
        ) : (
          <List disablePadding>
            {files.map((file) => (
              <ListItem
                key={file.id}
                divider
                secondaryAction={
                  <AppButton
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      void downloadDealFile(file).catch((err: unknown) => {
                        showError(err instanceof Error ? err.message : 'Не удалось скачать файл')
                      })
                    }}
                  >
                    Скачать
                  </AppButton>
                }
                sx={{ px: 0 }}
              >
                <AppIcon icon={File02Icon} size={22} color="text.secondary" aria-hidden />
                <ListItemText
                  sx={{ ml: 1.5 }}
                  primary={file.name}
                  secondary={`${formatFileSize(file.size)} · ${formatDate(file.createdAt)}`}
                />
              </ListItem>
            ))}
          </List>
        )
      ) : null}

      {tab === 3 ? (
        <Stack spacing={0}>
          {[...deal.events]
            .sort((a, b) => +new Date(a.date) - +new Date(b.date))
            .map((event, index, list) => (
            <Stack key={event.id} direction="row" spacing={2} sx={{ pb: 3 }}>
              <Stack alignItems="center" sx={{ width: 32 }}>
                <AppIcon icon={eventIcon(event.type)} size={22} color="secondary.main" aria-hidden />
                {index < list.length - 1 ? (
                  <Box
                    sx={{
                      flex: 1,
                      width: 2,
                      bgcolor: 'divider',
                      minHeight: 24,
                      mt: 1,
                    }}
                  />
                ) : null}
              </Stack>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(event.date)} · {formatRelativeDate(event.date)}
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.25 }}>
                  {event.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.description}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      ) : null}
    </Box>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="baseline">
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Stack>
  )
}
