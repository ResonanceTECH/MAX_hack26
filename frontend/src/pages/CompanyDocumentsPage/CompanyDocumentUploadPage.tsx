import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  documentSchema,
  type DocumentFormValues,
  useAddDocument,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { filesApi } from '@/shared/api/filesApi'
import { companyDocumentPath, ROUTES } from '@/shared/constants/routes'
import { AppButton, AppInput, PageHeader } from '@/shared/ui'

const ACCEPTED_EXT = ['.pdf', '.png', '.jpg', '.jpeg']
const ACCEPTED_MIME = new Set(['application/pdf', 'image/png', 'image/jpeg'])
const MAX_BYTES = 10 * 1024 * 1024

export function CompanyDocumentUploadPage() {
  const navigate = useNavigate()
  const companyId = useSessionStore((s) => s.company?.id)
  const addDocument = useAddDocument(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: { name: '', type: '', fileName: '' },
  })

  const onFileChange = (next: File | null) => {
    setFileError(null)
    setUploadProgress(null)
    if (!next) {
      setFile(null)
      form.setValue('fileName', '')
      return
    }
    const lower = next.name.toLowerCase()
    const okExt = ACCEPTED_EXT.some((ext) => lower.endsWith(ext))
    const okMime = !next.type || ACCEPTED_MIME.has(next.type)
    if (!okExt || !okMime) {
      setFileError('Допустимы только PDF, PNG, JPG')
      setFile(null)
      form.setValue('fileName', '')
      return
    }
    if (next.size > MAX_BYTES) {
      setFileError('Размер файла не должен превышать 10 МБ')
      setFile(null)
      form.setValue('fileName', '')
      return
    }
    setFile(next)
    form.setValue('fileName', next.name, { shouldValidate: true })
    if (!form.getValues('name')) {
      form.setValue('name', next.name.replace(/\.[^.]+$/, ''))
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!file) {
      setFileError('Выберите файл')
      return
    }
    setUploading(true)
    setUploadProgress(0)
    try {
      const uploaded = await filesApi.upload({
        file,
        onProgress: setUploadProgress,
      })
      const created = await addDocument.mutateAsync({
        ...values,
        fileName: uploaded.name || values.fileName,
        fileUrl: uploaded.url,
      })
      showSuccess('Документ загружен')
      void navigate(companyDocumentPath(created.id))
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка загрузки')
      setFileError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  })

  const busy = uploading || addDocument.isPending

  return (
    <Box>
      <PageHeader
        title="Загрузка документа"
        subtitle="PDF, PNG или JPG до 10 МБ"
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

      <Stack component="form" spacing={2} maxWidth={480} onSubmit={onSubmit}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Файл (PDF / PNG / JPG, до 10 МБ)
          </Typography>
          <AppButton component="label" variant="outlined" disabled={busy}>
            Выбрать файл
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              hidden
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </AppButton>
          {file ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {file.name} · {(file.size / 1024).toFixed(0)} КБ
              {file.type ? ` · ${file.type}` : ''}
            </Typography>
          ) : null}
          {fileError ? (
            <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
              {fileError}
            </Typography>
          ) : null}
          {uploadProgress != null && busy ? (
            <Box sx={{ mt: 1.5 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" color="text.secondary">
                Загрузка: {uploadProgress}%
              </Typography>
            </Box>
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

        <AppButton type="submit" variant="contained" loading={busy}>
          Загрузить
        </AppButton>
      </Stack>
    </Box>
  )
}
