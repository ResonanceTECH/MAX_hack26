import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import {
  usePlatformSettings,
  useUpdatePlatformSettings,
} from '@/features/admin/api/queries'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { AppButton, AppInput, ErrorState, LoadingState, PageHeader } from '@/shared/ui'
import { useState } from 'react'

export function AdminSettingsPage() {
  const query = usePlatformSettings()
  const update = useUpdatePlatformSettings()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const [draftMessage, setDraftMessage] = useState<string | null>(null)

  if (query.isLoading) return <LoadingState variant="page" />
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />

  const settings = query.data
  const message = draftMessage ?? settings.maintenance.message

  return (
    <Box>
      <PageHeader title="Настройки платформы" subtitle="Mock-конфигурация MVP" />
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Moderation
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.moderation.autoQueueNewCompanies}
                  onChange={(_, checked) =>
                    void update.mutateAsync({
                      moderation: { ...settings.moderation, autoQueueNewCompanies: checked },
                    })
                  }
                />
              }
              label="Автодобавление новых компаний в очередь"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.moderation.requireReasonOnReject}
                  onChange={(_, checked) =>
                    void update.mutateAsync({
                      moderation: { ...settings.moderation, requireReasonOnReject: checked },
                    })
                  }
                />
              }
              label="Обязательная причина при отклонении"
            />
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Matching
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.matching.boostVerifiedCompanies}
                  onChange={(_, checked) =>
                    void update.mutateAsync({
                      matching: { ...settings.matching, boostVerifiedCompanies: checked },
                    })
                  }
                />
              }
              label="Буст verified-компаний"
            />
            <Typography variant="body2" color="text.secondary">
              Min score: {settings.matching.minScoreToShow}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Notifications
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.pushEnabled}
                  onChange={(_, checked) =>
                    void update.mutateAsync({
                      notifications: { ...settings.notifications, pushEnabled: checked },
                    })
                  }
                />
              }
              label="Push-уведомления"
            />
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Maintenance
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.maintenance.enabled}
                  onChange={(_, checked) =>
                    void update
                      .mutateAsync({
                        maintenance: { ...settings.maintenance, enabled: checked, message },
                      })
                      .then(() => showSuccess('Настройки сохранены'))
                  }
                />
              }
              label="Режим обслуживания"
            />
            <AppInput
              label="Сообщение"
              value={message}
              onChange={(e) => setDraftMessage(e.target.value)}
              sx={{ mt: 1 }}
            />
            <AppButton
              sx={{ mt: 1 }}
              variant="outlined"
              onClick={() =>
                void update
                  .mutateAsync({
                    maintenance: { ...settings.maintenance, message },
                  })
                  .then(() => {
                    setDraftMessage(null)
                    showSuccess('Настройки сохранены')
                  })
              }
            >
              Сохранить сообщение
            </AppButton>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
