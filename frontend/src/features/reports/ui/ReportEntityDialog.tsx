import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useCreateReport } from '@/entities/report/api/queries'
import {
  REPORT_TYPE,
  type ReportEntityType,
  type ReportType,
} from '@/entities/report'
import { REPORT_TYPE_LABELS } from '@/features/moderation/model/labels'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { AppButton, AppTextarea } from '@/shared/ui'

export interface ReportEntityDialogProps {
  open: boolean
  onClose: () => void
  targetType: ReportEntityType
  targetId: string
  targetName: string
}

const REPORT_TYPE_OPTIONS = Object.values(REPORT_TYPE)

export function ReportEntityDialog({
  open,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportEntityDialogProps) {
  const createReport = useCreateReport()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [type, setType] = useState<ReportType>(REPORT_TYPE.SPAM)
  const [description, setDescription] = useState('')

  const resetAndClose = () => {
    setType(REPORT_TYPE.SPAM)
    setDescription('')
    onClose()
  }

  const handleSubmit = async () => {
    try {
      await createReport.mutateAsync({
        targetType,
        targetId,
        targetName,
        type,
        description: description.trim(),
      })
      showSuccess('Жалоба отправлена')
      resetAndClose()
    } catch (err) {
      const status = (err as Error & { status?: number }).status
      if (status === 409) {
        showError('Жалоба по этой сущности уже отправлена')
        return
      }
      showError(err instanceof Error ? err.message : 'Не удалось отправить жалобу')
    }
  }

  return (
    <Dialog open={open} onClose={resetAndClose} fullWidth maxWidth="sm">
      <DialogTitle>Пожаловаться</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Причина"
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
            fullWidth
          >
            {REPORT_TYPE_OPTIONS.map((value) => (
              <MenuItem key={value} value={value}>
                {REPORT_TYPE_LABELS[value]}
              </MenuItem>
            ))}
          </TextField>
          <AppTextarea
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton onClick={resetAndClose} disabled={createReport.isPending}>
          Отмена
        </AppButton>
        <AppButton
          variant="contained"
          loading={createReport.isPending}
          onClick={() => void handleSubmit()}
        >
          Отправить
        </AppButton>
      </DialogActions>
    </Dialog>
  )
}
