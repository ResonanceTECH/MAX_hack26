import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useResolveEscalation, DangerActionDialog } from '@/features/admin'
import { useEscalations } from '@/features/moderation/api/queries'
import { ESCALATION_REASON_LABELS } from '@/features/moderation/model/labels'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { formatDate } from '@/shared/lib/format'
import { moderationItemPath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppTextarea,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

const resolveSchema = z.object({
  reason: z.string().min(5, 'Укажите причину'),
  decision: z.string().min(3, 'Укажите решение'),
})

type ResolveForm = z.infer<typeof resolveSchema>

export function AdminModerationPage() {
  const query = useEscalations()
  const resolve = useResolveEscalation()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [escalationId, setEscalationId] = useState<string | null>(null)

  const form = useForm<ResolveForm>({
    resolver: zodResolver(resolveSchema),
    defaultValues: { reason: '', decision: '' },
  })

  const openItems = (query.data ?? []).filter(
    (e) => e.status === 'OPEN' || e.status === 'IN_PROGRESS',
  )
  const items = openItems.length > 0 ? openItems : (query.data ?? [])

  const submit = form.handleSubmit(async (values) => {
    if (!escalationId) return
    try {
      await resolve.mutateAsync({
        id: escalationId,
        reason: values.reason,
        decision: values.decision,
      })
      showSuccess('Эскалация закрыта')
      setEscalationId(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  })

  return (
    <Box>
      <PageHeader
        title="Модерация (Platform Admin)"
        subtitle="Эскалации и быстрый переход в очередь модераторов"
        actions={
          <AppButton
            component={RouterLink}
            to={ROUTES.MODERATION}
            variant="contained"
            sx={{ minHeight: 44 }}
          >
            Открыть /moderation
          </AppButton>
        }
      />

      {query.isLoading ? <LoadingState variant="list" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && items.length === 0 ? (
        <EmptyState title="Эскалаций нет" description="Сложные кейсы появятся здесь." />
      ) : null}

      <Stack spacing={1.5}>
        {items.map((esc) => (
          <Card key={esc.id} variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={esc.status} />
                <Chip
                  size="small"
                  variant="outlined"
                  label={ESCALATION_REASON_LABELS[esc.reason] ?? esc.reason}
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
                  Ответ: {esc.adminResponse}
                </Typography>
              ) : null}
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                <AppButton
                  component={RouterLink}
                  to={moderationItemPath(esc.entityType, esc.moderationItemId)}
                  size="small"
                  variant="outlined"
                  sx={{ minHeight: 44 }}
                >
                  Открыть объект
                </AppButton>
                <AppButton
                  component={RouterLink}
                  to={`/admin/moderation/${esc.entityType}/${esc.moderationItemId}`}
                  size="small"
                  variant="text"
                  sx={{ minHeight: 44 }}
                >
                  Admin item
                </AppButton>
                {!esc.adminResponse ? (
                  <AppButton
                    size="small"
                    variant="contained"
                    onClick={() => {
                      form.reset({ reason: '', decision: '' })
                      setEscalationId(esc.id)
                    }}
                    sx={{ minHeight: 44 }}
                  >
                    Закрыть эскалацию
                  </AppButton>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <DangerActionDialog
        open={Boolean(escalationId)}
        title="Закрыть эскалацию"
        description="Укажите решение и причину для audit log."
        confirmLabel="Закрыть"
        destructive={false}
        loading={resolve.isPending}
        onClose={() => setEscalationId(null)}
        onConfirm={() => void submit()}
      >
        <Controller
          name="decision"
          control={form.control}
          render={({ field, fieldState }) => (
            <AppTextarea
              {...field}
              label="Решение"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              minRows={2}
              sx={{ mt: 1, mb: 2 }}
            />
          )}
        />
        <Controller
          name="reason"
          control={form.control}
          render={({ field, fieldState }) => (
            <AppTextarea
              {...field}
              label="Причина"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              minRows={2}
            />
          )}
        />
      </DangerActionDialog>
    </Box>
  )
}
