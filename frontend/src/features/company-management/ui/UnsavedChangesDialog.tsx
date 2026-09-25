import { ConfirmDialog } from '@/shared/ui'

export interface UnsavedChangesDialogProps {
  open: boolean
  onStay: () => void
  onLeave: () => void
  loading?: boolean
}

export function UnsavedChangesDialog({
  open,
  onStay,
  onLeave,
  loading,
}: UnsavedChangesDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Есть несохранённые изменения"
      description="Если уйти сейчас, изменения будут потеряны."
      confirmLabel="Уйти без сохранения"
      cancelLabel="Остаться"
      destructive
      loading={loading}
      onCancel={onStay}
      onConfirm={onLeave}
    />
  )
}
