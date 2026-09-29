import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import type { DealEvent, DealFile } from '@/entities/deal'
import { useDeal, useFixDealTerms, useUploadDealFile } from '@/entities/deal/api/queries'
import { useOpportunity } from '@/entities/opportunity/api/queries'
import { useProposal } from '@/entities/proposal/api/queries'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { apiClient } from '@/shared/api/apiClient'
import { filesApi } from '@/shared/api/filesApi'
import { proposalDetailsPath } from '@/shared/constants/routes'
import { formatDate, formatRelativeDate } from '@/shared/lib/format'
import { getMaxBridge } from '@/shared/lib/max'
import {
  AppButton,
  AppIcon,
  AppInput,
  AppTextarea,
  BentoGrid,
  BentoTile,
  EmptyState,
  ErrorState,
  LoadingState,
  MoneyValue,
  PageHeader,
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
  const uploadFile = useUploadDealFile(id)
  const fixTerms = useFixDealTerms(id)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [termsSummary, setTermsSummary] = useState('')
  const [agreedPrice, setAgreedPrice] = useState('')
  const [agreedDays, setAgreedDays] = useState('')
  const showInfo = useSnackbarStore((s) => s.showInfo)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  useEffect(() => {
    const d = dealQuery.data
    if (!d) return
    setTermsSummary(d.termsSummary ?? '')
    setAgreedPrice(
      d.agreedPrice != null ? String(d.agreedPrice) : d.price != null ? String(d.price) : '',
    )
    setAgreedDays(
      d.agreedTermDays != null
        ? String(d.agreedTermDays)
        : d.durationDays != null
          ? String(d.durationDays)
          : '',
    )
  }, [dealQuery.data?.id, dealQuery.data?.updatedAt])

  if (dealQuery.isLoading) return <LoadingState variant="page" />
  if (dealQuery.isError || !dealQuery.data) {
    return <ErrorState onRetry={() => void dealQuery.refetch()} />
  }

  const deal = dealQuery.data
  const buyerName = opportunityQuery.data?.company.shortName ?? 'Заказчик'
  const headerTitle = `${deal.companyName} × ${buyerName}`
  const files = deal.files ?? []
  const uploading = uploadFile.isPending
  const termsFixed = Boolean(deal.termsSummary)

  const submitTerms = () => {
    const priceNum = agreedPrice.trim() ? Number(agreedPrice) : null
    const daysNum = agreedDays.trim() ? Number(agreedDays) : null
    if (priceNum != null && (!Number.isFinite(priceNum) || priceNum <= 0)) {
      showError('Укажите корректную стоимость')
      return
    }
    if (daysNum != null && (!Number.isInteger(daysNum) || daysNum <= 0)) {
      showError('Укажите срок целым числом дней')
      return
    }
    fixTerms.mutate(
      {
        termsSummary,
        agreedPrice: priceNum,
        agreedTermDays: daysNum,
      },
      {
        onSuccess: () => showSuccess('Условия зафиксированы'),
        onError: (err) =>
          showError(err instanceof Error ? err.message : 'Не удалось зафиксировать условия'),
      },
    )
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const onFileSelected = (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return
    if (file.size > filesApi.maxBytes) {
      showError('Файл больше 10 МБ')
      return
    }
    setUploadProgress(0)
    uploadFile.mutate(
      { file, onProgress: setUploadProgress },
      {
        onSuccess: (meta) => {
          showSuccess(`Файл «${meta.name}» загружен`)
          setUploadProgress(null)
        },
        onError: (err) => {
          showError(err instanceof Error ? err.message : 'Не удалось загрузить файл')
          setUploadProgress(null)
        },
      },
    )
  }

  return (
    <Box>
      <PageHeader
        title={headerTitle}
        subtitle={deal.opportunityTitle}
        actions={<StatusChip status={deal.status} kind="deal" />}
      />

      <BentoGrid>
        <BentoTile span={12} noPadding>
          <Tabs
            value={tab}
            onChange={(_, v: number) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
          >
            {TABS.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>
        </BentoTile>

        {tab === 0 ? (
          <>
            <BentoTile span={6} variant="emphasis">
              <Typography variant="h3" sx={{ mb: 1.5 }}>
                Сделка
              </Typography>
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
                <Row label="Контакт" value={deal.contactName || '—'} />
                <Row label="Следующий шаг" value={deal.nextAction} />
                <Row label="Последнее действие" value={deal.lastAction} />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                    Статус
                  </Typography>
                  <StatusChip status={deal.status} kind="deal" />
                </Stack>
              </Stack>
              <AppButton
                variant="outlined"
                sx={{ mt: 2, minHeight: 44 }}
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
            </BentoTile>

            <BentoTile span={6}>
              <Typography variant="h3" sx={{ mb: 1 }}>
                Фиксация условий
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Здесь стороны записывают согласованные условия (цена, срок, этапы). История только
                показывает факт — редактирование на этой вкладке «Обзор».
              </Typography>
              {termsFixed && deal.termsSummary ? (
                <Box
                  sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Уже зафиксировано
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {deal.termsSummary}
                  </Typography>
                </Box>
              ) : null}
              <Stack spacing={2}>
                <AppTextarea
                  label="Согласованные условия"
                  placeholder="Например: оплата 50/50, старт через неделю, NDA до пятницы…"
                  value={termsSummary}
                  onChange={(e) => setTermsSummary(e.target.value)}
                  minRows={3}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <AppInput
                    label="Согласованная стоимость, ₽"
                    type="number"
                    inputMode="numeric"
                    value={agreedPrice}
                    onChange={(e) => setAgreedPrice(e.target.value)}
                  />
                  <AppInput
                    label="Срок, дней"
                    type="number"
                    inputMode="numeric"
                    value={agreedDays}
                    onChange={(e) => setAgreedDays(e.target.value)}
                  />
                </Stack>
                <AppButton
                  variant="contained"
                  onClick={submitTerms}
                  loading={fixTerms.isPending}
                  disabled={fixTerms.isPending || termsSummary.trim().length < 3}
                >
                  {termsFixed ? 'Обновить условия' : 'Зафиксировать условия'}
                </AppButton>
              </Stack>
            </BentoTile>
          </>
        ) : null}

        {tab === 1 ? (
          <BentoTile span={12}>
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
          </BentoTile>
        ) : null}

        {tab === 2 ? (
          <BentoTile span={12}>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.txt"
              onChange={(e) => onFileSelected(e.target.files)}
            />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ sm: 'center' }}
              sx={{ mb: 2 }}
            >
              <AppButton
                variant="contained"
                onClick={openFilePicker}
                loading={uploading}
                disabled={uploading}
              >
                Загрузить файл
              </AppButton>
              <Typography variant="body2" color="text.secondary">
                Договоры, NDA, приложения — до 10 МБ
              </Typography>
            </Stack>
            {uploadProgress != null ? (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Загрузка… {uploadProgress}%
                </Typography>
              </Box>
            ) : null}
            {files.length === 0 ? (
              <EmptyState
                title="Файлов пока нет"
                description="Загрузите договор, NDA или приложение — файл будет доступен обеим сторонам сделки."
                actionLabel={uploading ? undefined : 'Выбрать файл'}
                onAction={uploading ? undefined : openFilePicker}
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
                            showError(
                              err instanceof Error ? err.message : 'Не удалось скачать файл',
                            )
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
            )}
          </BentoTile>
        ) : null}

        {tab === 3 ? (
          <BentoTile span={12}>
            <Stack spacing={0}>
              {[...deal.events]
                .sort((a, b) => +new Date(a.date) - +new Date(b.date))
                .map((event, index, list) => (
                  <Stack key={event.id} direction="row" spacing={2} sx={{ pb: 3 }}>
                    <Stack alignItems="center" sx={{ width: 32 }}>
                      <AppIcon
                        icon={eventIcon(event.type)}
                        size={22}
                        color="secondary.main"
                        aria-hidden
                      />
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
          </BentoTile>
        ) : null}
      </BentoGrid>
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
