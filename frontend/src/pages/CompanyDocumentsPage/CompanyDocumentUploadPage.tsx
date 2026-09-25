import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  documentSchema,
  type DocumentFormValues,
  useAddDocument,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { companyDocumentPath, ROUTES } from '@/shared/constants/routes'
import { AppButton, AppInput, PageHeader } from '@/shared/ui'

const ACCEPTED = ['.pdf', '.png', '.jpg', '.jpeg']
const MAX_BYTES = 10 * 1024 * 1024

export function CompanyDocumentUploadPage() {
  const navigate = useNavigate()
  const companyId = useSessionStore((s) => s.company?.id)
  const addDocument = useAddDocument(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [fileError, setFileError] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: { name: '', type: '', fileName: '' },
  })

  const onFileChange = (file: File | null) => {
    setFileError(null)
    if (!file) {
      setFileName('')
      form.setValue('fileName', '')
      return
    }
    const lower = file.name.toLowerCase()
    const okExt = ACCEPTED.some((ext) => lower.endsWith(ext))
    if (!okExt) {
      setFileError('Допустимы только PDF, PNG, JPG')
      return
    }
    if (file.size > MAX_BYTES) {
      setFileError('Размер файла не должен превышать 10 МБ')
      return
    }
    setFileName(file.name)
    form.setValue('fileName', file.name, { shouldValidate: true })
    if (!form.getValues('name')) {
      form.setValue('name', file.name.replace(/\.[^.]+$/, ''))
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!values.fileName) {
      setFileError('Выберите файл')
      return
    }
    try {
      const created = await addDocument.mutateAsync(values)
      showSuccess('Документ загружен (демо)')
      void navigate(companyDocumentPath(created.id))
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  })

  return (
    <Box>
      <PageHeader
        title="Загрузка документа"
        subtitle="Демонстрационный статус / MODEL_DATA"
        actions={
          <AppButton
            component={RouterLink}
            to={ROUTES.PROFILE_COMPANY_DOCUMENTS}
            variant="outlined"
          >
            К списку
          </AppButton>
        }
      />

      <Alert severity="info" sx={{ mb: 2, maxWidth: 560 }}>
        Это демо-загрузка: файл не отправляется на сервер. Статус документа будет
        «На проверке» (MODEL_DATA).
      </Alert>

      <Stack component="form" spacing={2} maxWidth={480} onSubmit={onSubmit}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Файл (PDF / PNG / JPG, до 10 МБ)
          </Typography>
          <AppButton component="label" variant="outlined">
            Выбрать файл
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              hidden
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </AppButton>
          {fileName ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {fileName}
            </Typography>
          ) : null}
          {fileError ? (
            <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
              {fileError}
            </Typography>
          ) : null}
        </Box>

        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <AppInput
              {...field}
              label="Название"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="type"
          control={form.control}
          render={({ field, fieldState }) => (
            <AppInput
              {...field}
              label="Тип документа"
              placeholder="Например, Выписка ЕГРЮЛ"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="number"
          control={form.control}
          render={({ field }) => (
            <AppInput {...field} value={field.value ?? ''} label="Номер (необязательно)" />
          )}
        />

        <AppButton type="submit" variant="contained" loading={addDocument.isPending}>
          Загрузить
        </AppButton>
      </Stack>
    </Box>
  )
}
