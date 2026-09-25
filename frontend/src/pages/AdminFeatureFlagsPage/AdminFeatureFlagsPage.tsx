import { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useFeatureFlags,
  useToggleFeatureFlag,
  featureFlagChangeSchema,
  type FeatureFlagChangeFormValues,
  DangerActionDialog,
} from '@/features/admin'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import type { FeatureFlag } from '@/shared/mocks/featureFlags'
import { formatDate } from '@/shared/lib/format'
import {
  AppTextarea,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

export function AdminFeatureFlagsPage() {
  const query = useFeatureFlags()
  const toggle = useToggleFeatureFlag()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [target, setTarget] = useState<{ flag: FeatureFlag; enabled: boolean } | null>(null)

  const form = useForm<FeatureFlagChangeFormValues>({
    resolver: zodResolver(featureFlagChangeSchema),
    defaultValues: { enabled: false, reason: '' },
  })

  const openToggle = (flag: FeatureFlag, enabled: boolean) => {
    form.reset({ enabled, reason: '' })
    setTarget({ flag, enabled })
  }

  const submit = form.handleSubmit(async (values) => {
    if (!target) return
    try {
      await toggle.mutateAsync({
        key: target.flag.key,
        enabled: values.enabled,
        reason: values.reason,
      })
      showSuccess(`Flag «${target.flag.key}» ${values.enabled ? 'включён' : 'выключен'}`)
      setTarget(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  })

  return (
    <Box>
      <PageHeader
        title="Feature flags"
        subtitle="Переключение требует причину и пишется в audit"
      />
      {query.isLoading ? <LoadingState variant="list" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="Флагов нет" />
      ) : null}

      <Stack spacing={1.5}>
        {(query.data ?? []).map((flag) => (
          <Card key={flag.id} variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={1.5}
                alignItems={{ sm: 'center' }}
              >
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={flag.key} />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={flag.scope === 'GLOBAL' ? 'Global' : 'Test'}
                    />
                    <Chip
                      size="small"
                      color={flag.enabled ? 'success' : 'default'}
                      label={flag.enabled ? 'Вкл' : 'Выкл'}
                    />
                  </Stack>
                  <Typography variant="h4">{flag.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {flag.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Обновлён {formatDate(flag.updatedAt)} · {flag.updatedBy}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={flag.enabled}
                      onChange={(_, checked) => openToggle(flag, checked)}
                    />
                  }
                  label={flag.enabled ? 'Включён' : 'Выключен'}
                  sx={{ minHeight: 44 }}
                />
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <DangerActionDialog
        open={Boolean(target)}
        title={
          target
            ? `${target.enabled ? 'Включить' : 'Выключить'} «${target.flag.key}»?`
            : ''
        }
        description="Причина обязательна. Изменение попадёт в audit log."
        confirmLabel="Подтвердить"
        loading={toggle.isPending}
        onClose={() => setTarget(null)}
        onConfirm={() => void submit()}
      >
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
              sx={{ mt: 1 }}
            />
          )}
        />
      </DangerActionDialog>
    </Box>
  )
}
