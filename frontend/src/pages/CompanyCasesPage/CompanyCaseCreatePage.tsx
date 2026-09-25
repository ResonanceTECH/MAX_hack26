import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { COMPANY_CASE_STATUS } from '@/entities/company-case'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { caseSchema, type CaseFormValues, useCreateCase } from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { companyCasePath, ROUTES } from '@/shared/constants/routes'
import { AppButton, PageHeader } from '@/shared/ui'
import { CaseFormFields } from './CaseFormFields'

export function CompanyCaseCreatePage() {
  const navigate = useNavigate()
  const companyId = useSessionStore((s) => s.company?.id)
  const createCase = useCreateCase(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: '',
      industry: '',
      description: '',
      result: '',
      technologies: [],
      status: COMPANY_CASE_STATUS.DRAFT,
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const created = await createCase.mutateAsync(values)
      showSuccess('Кейс создан')
      void navigate(companyCasePath(created.id))
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  })

  return (
    <Box>
      <PageHeader
        title="Новый кейс"
        actions={
          <AppButton component={RouterLink} to={ROUTES.PROFILE_COMPANY_CASES} variant="outlined">
            К списку
          </AppButton>
        }
      />
      <Stack component="form" spacing={2} maxWidth={560} onSubmit={onSubmit}>
        <CaseFormFields control={form.control} />
        <Stack direction="row" spacing={1}>
          <AppButton type="submit" variant="contained" loading={createCase.isPending}>
            Создать
          </AppButton>
          <AppButton
            variant="outlined"
            onClick={() => {
              form.setValue('status', COMPANY_CASE_STATUS.PUBLISHED)
              void onSubmit()
            }}
          >
            Создать и опубликовать
          </AppButton>
        </Stack>
      </Stack>
    </Box>
  )
}
