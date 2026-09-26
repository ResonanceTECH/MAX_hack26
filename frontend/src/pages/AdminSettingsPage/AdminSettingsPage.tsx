import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { NumberField } from '@base-ui/react/number-field'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  usePlatformSettings,
  useUpdatePlatformSettings,
  useSetMaintenanceMode,
  platformSettingsSchema,
  maintenanceModeSchema,
  type PlatformSettingsFormValues,
  type MaintenanceModeFormValues,
  DangerActionDialog,
} from '@/features/admin'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import type { PlatformSettings } from '@/shared/mocks/platformSettings'
import {
  AppButton,
  AppInput,
  AppTextarea,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

const MVP_RUNTIME_NOTE =
  'Настройка сохраняется, но в текущем MVP ещё не влияет на runtime.'

export function AdminSettingsPage() {
  const query = usePlatformSettings()
  const update = useUpdatePlatformSettings()
  const maintenance = useSetMaintenanceMode()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const [maintenanceOpen, setMaintenanceOpen] = useState(false)
  const [moderationDraft, setModerationDraft] = useState<PlatformSettings['moderation'] | null>(
    null,
  )
  const [notificationsDraft, setNotificationsDraft] = useState<
    PlatformSettings['notifications'] | null
  >(null)
  const [announcementDraft, setAnnouncementDraft] = useState<PlatformSettings['announcement'] | null>(
    null,
  )

  const form = useForm<PlatformSettingsFormValues>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: {
      general: {
        productName: '',
        supportContact: '',
        defaultLocale: 'ru-RU',
        statusMessage: '',
      },
      matching: {
        minScoreToShow: 70,
        maxRecommendationsPerRequest: 20,
        matchExplanationEnabled: true,
        boostVerifiedCompanies: true,
      },
    },
  })

  const maintenanceForm = useForm<MaintenanceModeFormValues>({
    resolver: zodResolver(maintenanceModeSchema),
    defaultValues: { enabled: true, reason: '', message: '' },
  })

  useEffect(() => {
    if (!query.data) return
    form.reset({
      general: query.data.general,
      matching: query.data.matching,
    })
    setModerationDraft(query.data.moderation)
    setNotificationsDraft(query.data.notifications)
    setAnnouncementDraft(query.data.announcement)
  }, [query.data, form])

  if (query.isLoading) return <LoadingState variant="page" />
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />

  const settings = query.data
  const moderation = moderationDraft ?? settings.moderation
  const notifications = notificationsDraft ?? settings.notifications
  const announcement = announcementDraft ?? settings.announcement

  const saveGeneralMatching = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        general: values.general,
        matching: values.matching,
      })
      showSuccess('Критические настройки сохранены')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  })

  const saveModeration = async () => {
    try {
      await update.mutateAsync({ moderation })
      showSuccess('Настройки модерации сохранены')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const saveNotifications = async () => {
    try {
      await update.mutateAsync({ notifications })
      showSuccess('Настройки уведомлений сохранены')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const saveAnnouncement = async () => {
    try {
      await update.mutateAsync({ announcement })
      showSuccess('Анонс сохранён')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const submitMaintenance = maintenanceForm.handleSubmit(async (values) => {
    try {
      await maintenance.mutateAsync({
        enabled: values.enabled,
        reason: values.reason,
        message: values.message,
      })
      showSuccess(values.enabled ? 'Режим обслуживания включён' : 'Режим обслуживания выключен')
      setMaintenanceOpen(false)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  })

  return (
    <Box>
      <PageHeader title="Настройки платформы" subtitle="Критические изменения — только с явным Save" />
      <Alert severity="warning" sx={{ mb: 2 }}>
        {MVP_RUNTIME_NOTE}
      </Alert>

      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Общие
            </Typography>
            <Stack spacing={2}>
              <Controller
                name="general.productName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <AppInput
                    {...field}
                    label="Название продукта"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="general.supportContact"
                control={form.control}
                render={({ field, fieldState }) => (
                  <AppInput
                    {...field}
                    label="Контакт поддержки"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="general.defaultLocale"
                control={form.control}
                render={({ field }) => <AppInput {...field} label="Локаль по умолчанию" />}
              />
              <Controller
                name="general.statusMessage"
                control={form.control}
                render={({ field }) => <AppTextarea {...field} label="Статусное сообщение" minRows={2} />}
              />
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Модерация
            </Typography>
            {(
              [
                ['autoQueueNewCompanies', 'Автоочередь новых компаний'],
                ['requireReasonOnReject', 'Обязательная причина при отклонении'],
                ['notifyOnDecision', 'Уведомлять о решении'],
                ['newCompaniesRequireModeration', 'Новые компании требуют модерации'],
                ['newDocumentsRequireModeration', 'Новые документы требуют модерации'],
                ['reportedOpportunitiesAutoEnter', 'Жалобы на запросы сразу в очередь'],
              ] as const
            ).map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    checked={moderation[key]}
                    onChange={(_, checked) =>
                      setModerationDraft({ ...moderation, [key]: checked })
                    }
                  />
                }
                label={label}
                sx={{ display: 'flex', minHeight: 44 }}
              />
            ))}
            <AppButton
              variant="contained"
              onClick={() => void saveModeration()}
              loading={update.isPending}
              sx={{ mt: 1, minHeight: 44 }}
            >
              Сохранить модерацию
            </AppButton>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Matching
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Минимальный score для показа
            </Typography>
            <Controller
              name="matching.minScoreToShow"
              control={form.control}
              render={({ field }) => (
                <NumberField.Root
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? 0)}
                  min={0}
                  max={100}
                  style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}
                >
                  <NumberField.Decrement
                    style={{ minWidth: 44, minHeight: 44, borderRadius: 8, border: '1px solid #ccc' }}
                  >
                    −
                  </NumberField.Decrement>
                  <NumberField.Input
                    style={{
                      width: 80,
                      minHeight: 44,
                      textAlign: 'center',
                      borderRadius: 8,
                      border: '1px solid #ccc',
                    }}
                  />
                  <NumberField.Increment
                    style={{ minWidth: 44, minHeight: 44, borderRadius: 8, border: '1px solid #ccc' }}
                  >
                    +
                  </NumberField.Increment>
                </NumberField.Root>
              )}
            />
            <Controller
              name="matching.maxRecommendationsPerRequest"
              control={form.control}
              render={({ field }) => (
                <AppInput
                  label="Макс. рекомендаций на запрос"
                  type="number"
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  sx={{ mb: 1 }}
                />
              )}
            />
            <Controller
              name="matching.matchExplanationEnabled"
              control={form.control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch checked={field.value} onChange={(_, c) => field.onChange(c)} />
                  }
                  label="Пояснения к матчу"
                  sx={{ display: 'flex', minHeight: 44 }}
                />
              )}
            />
            <Controller
              name="matching.boostVerifiedCompanies"
              control={form.control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch checked={field.value} onChange={(_, c) => field.onChange(c)} />
                  }
                  label="Буст verified-компаний"
                  sx={{ display: 'flex', minHeight: 44 }}
                />
              )}
            />
            <AppButton
              variant="contained"
              onClick={() => void saveGeneralMatching()}
              loading={update.isPending}
              sx={{ mt: 1, minHeight: 44 }}
            >
              Сохранить общие + matching
            </AppButton>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Уведомления
            </Typography>
            {(
              [
                ['emailDigest', 'Email digest'],
                ['pushEnabled', 'Push'],
                ['matchNotifications', 'Матчи'],
                ['proposalNotifications', 'Предложения'],
                ['moderationNotifications', 'Модерация'],
                ['deadlineReminders', 'Дедлайны'],
                ['systemNotifications', 'Системные'],
              ] as const
            ).map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    checked={notifications[key]}
                    onChange={(_, checked) =>
                      setNotificationsDraft({ ...notifications, [key]: checked })
                    }
                  />
                }
                label={label}
                sx={{ display: 'flex', minHeight: 44 }}
              />
            ))}
            <AppButton
              variant="contained"
              onClick={() => void saveNotifications()}
              sx={{ mt: 1, minHeight: 44 }}
            >
              Сохранить уведомления
            </AppButton>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderColor: 'error.light' }}>
          <CardContent>
            <Typography variant="h3" gutterBottom color="error">
              Режим обслуживания
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Сейчас: {settings.maintenance.enabled ? 'Включён' : 'Выключен'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              {settings.maintenance.message}
            </Typography>
            <AppButton
              color="error"
              variant="contained"
              sx={{ minHeight: 44 }}
              onClick={() => {
                maintenanceForm.reset({
                  enabled: !settings.maintenance.enabled,
                  reason: '',
                  message: settings.maintenance.message,
                })
                setMaintenanceOpen(true)
              }}
            >
              {settings.maintenance.enabled ? 'Выключить maintenance' : 'Включить maintenance'}
            </AppButton>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Анонс
            </Typography>
            <AppTextarea
              label="Текст анонса"
              value={announcement.text}
              onChange={(e) => setAnnouncementDraft({ ...announcement, text: e.target.value })}
              minRows={3}
              sx={{ mb: 2 }}
            />
            <AppButton variant="contained" onClick={() => void saveAnnouncement()} sx={{ minHeight: 44 }}>
              Сохранить анонс
            </AppButton>
          </CardContent>
        </Card>
      </Stack>

      <DangerActionDialog
        open={maintenanceOpen}
        title={
          maintenanceForm.watch('enabled')
            ? 'Включить режим обслуживания?'
            : 'Выключить режим обслуживания?'
        }
        description="Действие критическое и будет записано в audit log с причиной."
        confirmLabel="Подтвердить"
        loading={maintenance.isPending}
        onClose={() => setMaintenanceOpen(false)}
        onConfirm={() => void submitMaintenance()}
      >
        <Controller
          name="reason"
          control={maintenanceForm.control}
          render={({ field, fieldState }) => (
            <AppTextarea
              {...field}
              label="Причина"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              minRows={3}
              sx={{ mt: 1, mb: 2 }}
            />
          )}
        />
        <Controller
          name="message"
          control={maintenanceForm.control}
          render={({ field }) => (
            <AppTextarea {...field} label="Сообщение пользователям" minRows={2} />
          )}
        />
      </DangerActionDialog>
    </Box>
  )
}
