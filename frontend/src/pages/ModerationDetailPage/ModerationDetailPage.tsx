import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  useApproveModeration,
  useBlockModeration,
  useModerationItem,
  useRejectModeration,
  useRequestChanges,
} from '@/features/moderation/api/queries'
import {
  MODERATION_STATUS_LABELS,
  MODERATION_TYPE_LABELS,
} from '@/features/moderation/model/labels'
import {
  moderationDecisionSchema,
  type ModerationDecisionFormValues,
} from '@/features/moderation/model/schemas'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { formatDate } from '@/shared/lib/format'
import { ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppTextarea,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

type DecisionKind = 'reject' | 'request_changes' | 'block'

export function ModerationDetailPage() {
  const { type = 'item', id = '' } = useParams()
  const navigate = useNavigate()
  const query = useModerationItem(type, id)
  const approve = useApproveModeration()
  const reject = useRejectModeration()
  const requestChanges = useRequestChanges()
  const block = useBlockModeration()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const [reasonOpen, setReasonOpen] = useState<DecisionKind | null>(null)
  const [approveOpen, setApproveOpen] = useState(false)

  const form = useForm<ModerationDecisionFormValues>({
    resolver: zodResolver(moderationDecisionSchema),
    defaultValues: { reason: '' },
  })

  const item = query.data

  const goQueue = () => navigate(ROUTES.MODERATION_QUEUE)

  const submitReason = form.handleSubmit(async (values) => {
    if (!item || !reasonOpen) return
    try {
      if (reasonOpen === 'reject') await reject.mutateAsync({ id: item.id, reason: values.reason })
      if (reasonOpen === 'request_changes') {
        await requestChanges.mutateAsync({ id: item.id, reason: values.reason })
      }
      if (reasonOpen === 'block') await block.mutateAsync({ id: item.id, reason: values.reason })
      showSuccess(
        reasonOpen === 'reject'
          ? 'Объект отклонён'
          : reasonOpen === 'block'
            ? 'Объект заблокирован'
            : 'Запрошены исправления',
      )
      setReasonOpen(null)
      form.reset()
      goQueue()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  })

  if (query.isLoading) return <LoadingState variant="page" />
  if (query.isError || !item) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  return (
    <Box>
      <PageHeader
        title={item.title}
        subtitle={`${MODERATION_TYPE_LABELS[item.type]} · ${item.companyName}`}
      />
      <Stack spacing={2}>
        <Stack direction="row" spacing={1}>
          <Chip label={MODERATION_TYPE_LABELS[item.type]} size="small" />
          <Chip label={MODERATION_STATUS_LABELS[item.status]} size="small" color="warning" />
        </Stack>
        <Typography variant="body1">{item.summary}</Typography>
        <Typography variant="body2" color="text.secondary">
          Автор: {item.authorName} · Подано: {formatDate(item.submittedAt)}
        </Typography>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Данные объекта
            </Typography>
            <Stack spacing={0.75}>
              {Object.entries(item.payload).map(([key, value]) => (
                <Typography key={key} variant="body2">
                  <strong>{key}:</strong> {String(value)}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {item.status === 'pending' ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
            <AppButton variant="contained" color="success" onClick={() => setApproveOpen(true)}>
              Одобрить
            </AppButton>
            <AppButton variant="outlined" color="error" onClick={() => setReasonOpen('reject')}>
              Отклонить
            </AppButton>
            <AppButton variant="outlined" onClick={() => setReasonOpen('request_changes')}>
              Запросить исправления
            </AppButton>
            <AppButton variant="outlined" color="error" onClick={() => setReasonOpen('block')}>
              Заблокировать
            </AppButton>
          </Stack>
        ) : null}

        <AppButton component={RouterLink} to={ROUTES.MODERATION_QUEUE} variant="text">
          К очереди
        </AppButton>
      </Stack>

      <ConfirmDialog
        open={approveOpen}
        title={`Одобрить «${item.title}»?`}
        description="Объект будет опубликован / подтверждён на платформе."
        confirmLabel="Одобрить"
        onCancel={() => setApproveOpen(false)}
        onConfirm={() => {
          void approve.mutateAsync(item.id).then(() => {
            showSuccess('Компания одобрена'.includes('одобр') ? 'Объект одобрен' : 'Одобрено')
            setApproveOpen(false)
            goQueue()
          })
        }}
      />

      <Dialog open={Boolean(reasonOpen)} onClose={() => setReasonOpen(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {reasonOpen === 'reject'
            ? `Отклонить «${item.title}»?`
            : reasonOpen === 'block'
              ? `Заблокировать «${item.title}»?`
              : `Запросить исправления для «${item.title}»`}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Укажите причину — она будет видна автору.
          </Typography>
          <Controller
            name="reason"
            control={form.control}
            render={({ field, fieldState }) => (
              <AppTextarea
                {...field}
                label="Причина"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                minRows={3}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton onClick={() => setReasonOpen(null)}>Отмена</AppButton>
          <AppButton
            variant="contained"
            color={reasonOpen === 'request_changes' ? 'primary' : 'error'}
            onClick={() => void submitReason()}
          >
            Подтвердить
          </AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
