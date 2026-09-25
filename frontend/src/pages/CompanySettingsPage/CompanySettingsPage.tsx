import { useState } from 'react'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  useCompanySettings,
  useUpdateCompanySettings,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import type { CompanySettingsPatch } from '@/shared/api/settingsApi'
import {
  AppButton,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Section,
} from '@/shared/ui'

function SettingSwitch({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <Box
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
          <Switch checked={checked} disabled={disabled} onChange={(_, v) => onChange(v)} />
        }
        label={
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
        }
      />
    </Box>
  )
}

export function CompanySettingsPage() {
  const company = useSessionStore((s) => s.company)
  const companyId = company?.id
  const { data, isLoading, isError, refetch } = useCompanySettings(companyId)
  const update = useUpdateCompanySettings(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  if (isLoading) return <LoadingState variant="page" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const patch = async (next: CompanySettingsPatch) => {
    try {
      await update.mutateAsync(next)
      showSuccess('Настройка сохранена')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не удалось сохранить')
    }
  }

  const expectedName = company?.shortName ?? company?.name ?? ''
  const nameOk = confirmName.trim().toLowerCase() === expectedName.toLowerCase()

  return (
    <Box>
      <PageHeader title="Настройки" subtitle="Параметры компании" />

      <Stack spacing={3} maxWidth={560}>
        <Section title="Уведомления">
          <Stack spacing={1.5}>
            <SettingSwitch
              label="Новые отклики"
              description="Уведомления о новых предложениях по вашим запросам"
              checked={data.notifications.newProposals}
              disabled={update.isPending}
              onChange={(v) => void patch({ notifications: { newProposals: v } })}
            />
            <SettingSwitch
              label="Подходящие заказы"
              description="Рекомендации заказов для вашей компании"
              checked={data.notifications.matchingOrders}
              disabled={update.isPending}
              onChange={(v) => void patch({ notifications: { matchingOrders: v } })}
            />
            <SettingSwitch
              label="Статусы откликов"
              description="Изменения статусов ваших предложений"
              checked={data.notifications.proposalStatusChanges}
              disabled={update.isPending}
              onChange={(v) => void patch({ notifications: { proposalStatusChanges: v } })}
            />
            <SettingSwitch
              label="Shortlist"
              description="События shortlist"
              checked={data.notifications.shortlist}
              disabled={update.isPending}
              onChange={(v) => void patch({ notifications: { shortlist: v } })}
            />
            <SettingSwitch
              label="Переговоры"
              description="Сообщения и статусы переговоров"
              checked={data.notifications.negotiations}
              disabled={update.isPending}
              onChange={(v) => void patch({ notifications: { negotiations: v } })}
            />
            <SettingSwitch
              label="Напоминания о сроках"
              description="Дедлайны по запросам и сделкам"
              checked={data.notifications.deadlineReminders}
              disabled={update.isPending}
              onChange={(v) => void patch({ notifications: { deadlineReminders: v } })}
            />
            <SettingSwitch
              label="Управление компанией"
              description="События команды, услуг и документов"
              checked={data.notifications.companyManagementEvents}
              disabled={update.isPending}
              onChange={(v) => void patch({ notifications: { companyManagementEvents: v } })}
            />
          </Stack>
        </Section>

        <Section title="Видимость">
          <Stack spacing={1.5}>
            <SettingSwitch
              label="Публичный профиль"
              description="Компания видна в каталоге"
              checked={data.visibility.publicProfile}
              disabled={update.isPending}
              onChange={(v) => void patch({ visibility: { publicProfile: v } })}
            />
            <SettingSwitch
              label="Показывать услуги"
              description="Услуги на публичной странице"
              checked={data.visibility.showServices}
              disabled={update.isPending}
              onChange={(v) => void patch({ visibility: { showServices: v } })}
            />
            <SettingSwitch
              label="Показывать цены"
              description="Диапазоны цен в каталоге"
              checked={data.visibility.showPrices}
              disabled={update.isPending}
              onChange={(v) => void patch({ visibility: { showPrices: v } })}
            />
            <SettingSwitch
              label="Показывать кейсы"
              description="Кейсы на публичной странице"
              checked={data.visibility.showCases}
              disabled={update.isPending}
              onChange={(v) => void patch({ visibility: { showCases: v } })}
            />
            <SettingSwitch
              label="Показывать документы"
              description="Проверенные документы публично"
              checked={data.visibility.showDocuments}
              disabled={update.isPending}
              onChange={(v) => void patch({ visibility: { showDocuments: v } })}
            />
          </Stack>
        </Section>

        <Section title="Matching">
          <Stack spacing={1.5}>
            <SettingSwitch
              label="Рекомендации заказов"
              description="Получать рекомендации подходящих запросов"
              checked={data.matching.receiveOrderRecommendations}
              disabled={update.isPending}
              onChange={(v) => void patch({ matching: { receiveOrderRecommendations: v } })}
            />
            <SettingSwitch
              label="Показывать в рекомендациях"
              description="Компания может предлагаться заказчикам"
              checked={data.matching.showInCustomerRecommendations}
              disabled={update.isPending}
              onChange={(v) => void patch({ matching: { showInCustomerRecommendations: v } })}
            />
            <SettingSwitch
              label="Учитывать кейсы"
              description="Кейсы влияют на matching"
              checked={data.matching.useCasesInMatching}
              disabled={update.isPending}
              onChange={(v) => void patch({ matching: { useCasesInMatching: v } })}
            />
            <SettingSwitch
              label="Учитывать документы"
              description="Верифицированные документы влияют на matching"
              checked={data.matching.useDocumentsInMatching}
              disabled={update.isPending}
              onChange={(v) => void patch({ matching: { useDocumentsInMatching: v } })}
            />
          </Stack>
        </Section>

        <Section title="Опасная зона">
          {data.archived ? (
            <EmptyState
              title="Компания в архиве"
              description="Профиль скрыт из каталога."
              actionLabel="Восстановить"
              onAction={() => void patch({ archived: false })}
            />
          ) : (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'error.light',
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Архивировать компанию
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Профиль исчезнет из каталога. Действие можно отменить.
              </Typography>
              <AppButton color="error" variant="outlined" onClick={() => setArchiveOpen(true)}>
                Архивировать
              </AppButton>
            </Box>
          )}
        </Section>
      </Stack>

      <ConfirmDialog
        open={archiveOpen}
        title="Архивировать компанию?"
        description={`Введите «${expectedName}» для подтверждения.`}
        confirmLabel="Архивировать"
        destructive
        loading={update.isPending}
        onCancel={() => {
          setArchiveOpen(false)
          setConfirmName('')
        }}
        onConfirm={() => {
          if (!nameOk) {
            showError('Название не совпадает')
            return
          }
          void patch({ archived: true }).then(() => {
            setArchiveOpen(false)
            setConfirmName('')
          })
        }}
      >
        <TextField
          fullWidth
          size="small"
          label="Название компании"
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          sx={{ mt: 2 }}
        />
      </ConfirmDialog>
    </Box>
  )
}
