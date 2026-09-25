import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormHelperText from '@mui/material/FormHelperText'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  blockModerationSchema,
  escalateSchema,
  rejectModerationSchema,
  requestChangesSchema,
  resolveReportSchema,
  type BlockModerationFormValues,
  type EscalateFormValues,
  type RejectModerationFormValues,
  type RequestChangesFormValues,
  type ResolveReportFormValues,
} from '../model/schemas'
import { AppButton, AppTextarea } from '@/shared/ui'

type ReasonOption = { value: string; label: string }

export function RejectDialog({
  open,
  title,
  reasons,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  reasons: readonly ReasonOption[]
  loading?: boolean
  onClose: () => void
  onSubmit: (values: RejectModerationFormValues) => Promise<void>
}) {
  const form = useForm<RejectModerationFormValues>({
    resolver: zodResolver(rejectModerationSchema),
    defaultValues: { reasonCode: '', comment: '', privateNote: '' },
  })
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Controller
            name="reasonCode"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                label="Причина"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              >
                {reasons.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="comment"
            control={form.control}
            render={({ field, fieldState }) => (
              <AppTextarea
                {...field}
                label="Комментарий"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                minRows={3}
              />
            )}
          />
          <Controller
            name="privateNote"
            control={form.control}
            render={({ field }) => (
              <AppTextarea {...field} label="Приватная заметка (не видно компании)" minRows={2} />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton onClick={onClose} disabled={loading}>
          Отмена
        </AppButton>
        <AppButton
          variant="contained"
          color="error"
          loading={loading}
          onClick={() => void form.handleSubmit(onSubmit)()}
        >
          Отклонить
        </AppButton>
      </DialogActions>
    </Dialog>
  )
}

export function RequestChangesDialog({
  open,
  title,
  fields,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  fields: readonly ReasonOption[]
  loading?: boolean
  onClose: () => void
  onSubmit: (values: RequestChangesFormValues) => Promise<void>
}) {
  const form = useForm<RequestChangesFormValues>({
    resolver: zodResolver(requestChangesSchema),
    defaultValues: { fields: [], comment: '', privateNote: '' },
  })
  const selected = form.watch('fields')
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, mt: 1 }}>
          Укажите, какие элементы требуют правки.
        </Typography>
        <FormGroup>
          {fields.map((f) => (
            <FormControlLabel
              key={f.value}
              control={
                <Checkbox
                  checked={selected.includes(f.value)}
                  onChange={(_, checked) => {
                    const next = checked
                      ? [...selected, f.value]
                      : selected.filter((v) => v !== f.value)
                    form.setValue('fields', next, { shouldValidate: true })
                  }}
                />
              }
              label={f.label}
            />
          ))}
        </FormGroup>
        {form.formState.errors.fields ? (
          <FormHelperText error>{form.formState.errors.fields.message}</FormHelperText>
        ) : null}
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Controller
            name="comment"
            control={form.control}
            render={({ field, fieldState }) => (
              <AppTextarea
                {...field}
                label="Комментарий для владельца"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                minRows={3}
              />
            )}
          />
          <Controller
            name="privateNote"
            control={form.control}
            render={({ field }) => (
              <AppTextarea {...field} label="Приватная заметка" minRows={2} />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton onClick={onClose} disabled={loading}>
          Отмена
        </AppButton>
        <AppButton
          variant="contained"
          loading={loading}
          onClick={() => void form.handleSubmit(onSubmit)()}
        >
          Запросить исправления
        </AppButton>
      </DialogActions>
    </Dialog>
  )
}

export function BlockDialog({
  open,
  title,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  loading?: boolean
  onClose: () => void
  onSubmit: (values: BlockModerationFormValues) => Promise<void>
}) {
  const form = useForm<BlockModerationFormValues>({
    resolver: zodResolver(blockModerationSchema),
    defaultValues: { reasonCode: 'FORBIDDEN_CONTENT', comment: '', privateNote: '' },
  })
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="error" sx={{ mb: 2, mt: 1 }}>
          Блокировка — серьёзное действие. Данные не удаляются, но объект скрывается.
        </Typography>
        <Stack spacing={2}>
          <Controller
            name="reasonCode"
            control={form.control}
            render={({ field }) => (
              <TextField {...field} select label="Причина" fullWidth>
                <MenuItem value="FORBIDDEN_CONTENT">Запрещённый контент</MenuItem>
                <MenuItem value="FRAUD">Мошенничество</MenuItem>
                <MenuItem value="OTHER">Другое</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="comment"
            control={form.control}
            render={({ field, fieldState }) => (
              <AppTextarea
                {...field}
                label="Комментарий"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                minRows={3}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton onClick={onClose} disabled={loading}>
          Отмена
        </AppButton>
        <AppButton
          variant="contained"
          color="error"
          loading={loading}
          onClick={() => void form.handleSubmit(onSubmit)()}
        >
          Заблокировать
        </AppButton>
      </DialogActions>
    </Dialog>
  )
}

export function EscalateDialog({
  open,
  title,
  reasons,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  reasons: readonly ReasonOption[]
  loading?: boolean
  onClose: () => void
  onSubmit: (values: EscalateFormValues) => Promise<void>
}) {
  const form = useForm<EscalateFormValues>({
    resolver: zodResolver(escalateSchema),
    defaultValues: { reasonCode: '', comment: '', privateNote: '' },
  })
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
          Передать Platform Admin
        </Typography>
        <Stack spacing={2}>
          <Controller
            name="reasonCode"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                label="Причина"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              >
                {reasons.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="comment"
            control={form.control}
            render={({ field, fieldState }) => (
              <AppTextarea
                {...field}
                label="Комментарий"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                minRows={3}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton onClick={onClose} disabled={loading}>
          Отмена
        </AppButton>
        <AppButton
          variant="contained"
          loading={loading}
          onClick={() => void form.handleSubmit(onSubmit)()}
        >
          Передать
        </AppButton>
      </DialogActions>
    </Dialog>
  )
}

export function ResolveReportDialog({
  open,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean
  loading?: boolean
  onClose: () => void
  onSubmit: (values: ResolveReportFormValues) => Promise<void>
}) {
  const form = useForm<ResolveReportFormValues>({
    resolver: zodResolver(resolveReportSchema),
    defaultValues: { resolutionCode: '', comment: '', applyAction: 'none' },
  })
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Закрыть жалобу</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Controller
            name="resolutionCode"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                label="Причина"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              >
                <MenuItem value="NO_VIOLATION">Нарушение не подтверждено</MenuItem>
                <MenuItem value="DUPLICATE">Дубликат жалобы</MenuItem>
                <MenuItem value="ALREADY_FIXED">Проблема уже устранена</MenuItem>
                <MenuItem value="ACTION_TAKEN">Применить действие</MenuItem>
                <MenuItem value="OTHER">Другое</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="applyAction"
            control={form.control}
            render={({ field }) => (
              <TextField {...field} select label="Действие с объектом" fullWidth>
                <MenuItem value="none">Без действия</MenuItem>
                <MenuItem value="request_changes">Запросить исправления</MenuItem>
                <MenuItem value="reject">Отклонить</MenuItem>
                <MenuItem value="block">Заблокировать</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="comment"
            control={form.control}
            render={({ field, fieldState }) => (
              <AppTextarea
                {...field}
                label="Комментарий"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                minRows={3}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton onClick={onClose} disabled={loading}>
          Отмена
        </AppButton>
        <AppButton
          variant="contained"
          loading={loading}
          onClick={() => void form.handleSubmit(onSubmit)()}
        >
          Закрыть жалобу
        </AppButton>
      </DialogActions>
    </Dialog>
  )
}
