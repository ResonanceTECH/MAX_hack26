import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import type { ModerationEntityType, ModerationItem } from '@/entities/moderation'
import { useMyModerationItems, useResubmitModerationItem } from '@/features/moderation/api/queries'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import {
  companyCaseEditPath,
  companyDocumentPath,
  ROUTES,
} from '@/shared/constants/routes'
import { AppButton } from '@/shared/ui'

function editPathFor(item: ModerationItem): string {
  switch (item.entityType) {
    case 'opportunity':
      return `/opportunities/${item.entityId}`
    case 'company':
      return ROUTES.COMPANY_EDIT
    case 'case':
      return companyCaseEditPath(item.entityId)
    case 'document':
      return companyDocumentPath(item.entityId)
    default:
      return ROUTES.COMPANY_ADMIN
  }
}

export function NeedsChangesBanner({
  entityType,
  entityId,
}: {
  entityType: ModerationEntityType
  entityId: string
}) {
  const query = useMyModerationItems()
  const resubmit = useResubmitModerationItem()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  if (query.isLoading) return null

  const item = (query.data ?? []).find(
    (i) => i.entityType === entityType && i.entityId === entityId && i.status === 'NEEDS_CHANGES',
  )
  if (!item) return null

  const fields =
    (Array.isArray(item.payload.fieldsRequested)
      ? (item.payload.fieldsRequested as string[])
      : null) ??
    item.checklist ??
    []

  const onResubmit = async () => {
    try {
      await resubmit.mutateAsync({ id: item.id, patch: {} })
      showSuccess('Отправлено на повторную проверку')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка отправки')
    }
  }

  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      <AlertTitle>Требуются исправления</AlertTitle>
      {item.moderatorNote ? (
        <Typography variant="body2" sx={{ mb: 1 }}>
          Комментарий модератора: {item.moderatorNote}
        </Typography>
      ) : null}
      {fields.length > 0 ? (
        <Typography variant="body2" sx={{ mb: 1 }}>
          Поля к исправлению: {fields.join(', ')}
        </Typography>
      ) : null}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        <AppButton
          component={RouterLink}
          to={editPathFor(item)}
          size="small"
          variant="outlined"
          sx={{ minHeight: 44 }}
        >
          Исправить
        </AppButton>
        <AppButton
          size="small"
          variant="contained"
          loading={resubmit.isPending}
          onClick={() => void onResubmit()}
          sx={{ minHeight: 44 }}
        >
          Отправить повторно
        </AppButton>
      </Stack>
    </Alert>
  )
}

/** Lists all NEEDS_CHANGES items for the owner (e.g. company overview). */
export function NeedsChangesList() {
  const query = useMyModerationItems()
  if (query.isLoading || !query.data?.length) return null
  const items = query.data.filter((i) => i.status === 'NEEDS_CHANGES')
  if (items.length === 0) return null
  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      {items.map((item) => (
        <NeedsChangesBanner
          key={item.id}
          entityType={item.entityType}
          entityId={item.entityId}
        />
      ))}
    </Stack>
  )
}
