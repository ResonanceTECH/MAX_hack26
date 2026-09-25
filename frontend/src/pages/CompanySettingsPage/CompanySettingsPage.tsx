import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { Permission } from '@/features/permissions'
import { usePermission } from '@/features/permissions/hooks/usePermission'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { ROUTES } from '@/shared/constants/routes'
import { AppButton, EmptyState, PageHeader } from '@/shared/ui'

interface SettingItem {
  key: string
  label: string
  description: string
  defaultValue: boolean
}

const SETTINGS: SettingItem[] = [
  {
    key: 'publicProfile',
    label: 'Публичный профиль',
    description: 'Компания видна в каталоге B2B Match',
    defaultValue: true,
  },
  {
    key: 'emailNotifications',
    label: 'Email-уведомления',
    description: 'Письма о новых откликах и приглашениях',
    defaultValue: true,
  },
  {
    key: 'maxNotifications',
    label: 'Уведомления в MAX',
    description: 'Пуш-уведомления в мессенджере MAX',
    defaultValue: true,
  },
  {
    key: 'autoShortlistDigest',
    label: 'Дайджест shortlist',
    description: 'Еженедельная сводка по shortlist команды',
    defaultValue: false,
  },
]

export function CompanySettingsPage() {
  const canEdit = usePermission(Permission.EDIT_COMPANY)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SETTINGS.map((s) => [s.key, s.defaultValue])),
  )

  if (!canEdit) {
    return <EmptyState title="Нет доступа" description="Настройки компании недоступны." />
  }

  return (
    <Box>
      <PageHeader
        title="Настройки"
        subtitle="Базовые параметры компании"
        actions={
          <AppButton component={RouterLink} to={ROUTES.COMPANY_ADMIN} variant="outlined">
            Назад
          </AppButton>
        }
      />

      <Stack spacing={2} maxWidth={560}>
        {SETTINGS.map((item) => (
          <Box
            key={item.key}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={values[item.key]}
                  onChange={(_, checked) => {
                    setValues((prev) => ({ ...prev, [item.key]: checked }))
                    showSuccess('Настройка сохранена')
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
              }
            />
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
