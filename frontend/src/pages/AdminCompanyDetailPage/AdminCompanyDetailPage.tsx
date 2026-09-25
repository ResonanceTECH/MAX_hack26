import { useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useAdminCompany,
  useUpdateCompanyStatus,
  useChangeCompanyVerification,
  useBlockCompany,
  useArchiveCompany,
  useSendCompanyToModeration,
  canBlockCompany,
  changeCompanyStatusSchema,
  changeVerificationSchema,
  type ChangeCompanyStatusFormValues,
  type ChangeVerificationFormValues,
  PLATFORM_COMPANY_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  PlatformStatusChip,
  VerificationStatusChip,
  DangerActionDialog,
} from '@/features/admin'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import type { PlatformCompanyStatus, VerificationStatus } from '@/shared/api/adminCompaniesApi'
import { ROUTES } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import {
  AppButton,
  AppSelect,
  AppTextarea,
  CompanyAvatar,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

type DialogKind = 'status' | 'verification' | 'block' | 'archive' | null

const BLOCK_CONSEQUENCES =
  'После блокировки: пользователи компании теряют операционный доступ, предложения и матчи скрываются из активных процессов, компания исчезает из публичного каталога до разблокировки.'

export function AdminCompanyDetailPage() {
  const { id = '' } = useParams()
  const query = useAdminCompany(id)
  const updateStatus = useUpdateCompanyStatus()
  const changeVerification = useChangeCompanyVerification()
  const block = useBlockCompany()
  const archive = useArchiveCompany()
  const sendMod = useSendCompanyToModeration()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const [tab, setTab] = useState(0)
  const [dialog, setDialog] = useState<DialogKind>(null)

  const statusForm = useForm<ChangeCompanyStatusFormValues>({
    resolver: zodResolver(changeCompanyStatusSchema),
    defaultValues: { status: 'ACTIVE', reason: '' },
  })
  const verificationForm = useForm<ChangeVerificationFormValues>({
    resolver: zodResolver(changeVerificationSchema),
    defaultValues: { verificationStatus: 'PENDING', reason: '' },
  })

  if (query.isLoading) return <LoadingState variant="page" />
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />

  const company = query.data
  const blockCheck = canBlockCompany(company.platformStatus)

  const openStatus = () => {
    statusForm.reset({ status: company.platformStatus, reason: '' })
    setDialog('status')
  }
  const openVerification = () => {
    verificationForm.reset({
      verificationStatus: company.verificationStatus,
      reason: '',
    })
    setDialog('verification')
  }

  const submitStatus = statusForm.handleSubmit(async (values) => {
    try {
      await updateStatus.mutateAsync({
        id: company.id,
        status: values.status as PlatformCompanyStatus,
        reason: values.reason,
      })
      showSuccess('Статус компании обновлён')
      setDialog(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  })

  const submitVerification = verificationForm.handleSubmit(async (values) => {
    try {
      await changeVerification.mutateAsync({
        id: company.id,
        verificationStatus: values.verificationStatus as VerificationStatus,
        reason: values.reason,
      })
      showSuccess('Verification обновлён')
      setDialog(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  })

  const submitBlock = statusForm.handleSubmit(async (values) => {
    try {
      await block.mutateAsync({ id: company.id, reason: values.reason })
      showSuccess('Компания заблокирована')
      setDialog(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  })

  const submitArchive = statusForm.handleSubmit(async (values) => {
    try {
      await archive.mutateAsync({ id: company.id, reason: values.reason })
      showSuccess('Компания архивирована')
      setDialog(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
    }
  })

  return (
    <Box>
      <PageHeader
        title={company.name}
        subtitle={`ИНН ${company.inn} · ${company.region}`}
        actions={
          <AppButton component={RouterLink} to={ROUTES.ADMIN_COMPANIES} variant="text" sx={{ minHeight: 44 }}>
            К списку
          </AppButton>
        }
      />

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <CompanyAvatar name={company.name} logoUrl={company.logoUrl} size={56} />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <PlatformStatusChip status={company.platformStatus} />
          <VerificationStatusChip status={company.verificationStatus} />
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 2 }}>
        Platform Admin не редактирует коммерческие поля компании (описание, услуги, кейсы) — только
        платформенный статус и verification.
      </Alert>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <AppButton variant="outlined" onClick={openStatus} sx={{ minHeight: 44 }}>
          Изменить статус
        </AppButton>
        <AppButton variant="outlined" onClick={openVerification} sx={{ minHeight: 44 }}>
          Изменить verification
        </AppButton>
        <AppButton
          variant="outlined"
          onClick={() =>
            void sendMod
              .mutateAsync(company.id)
              .then(() => showSuccess('Отправлено на проверку'))
              .catch((e: unknown) => showError(e instanceof Error ? e.message : 'Ошибка'))
          }
          sx={{ minHeight: 44 }}
        >
          В модерацию
        </AppButton>
        <AppButton
          color="error"
          variant="outlined"
          disabled={!blockCheck.allowed}
          onClick={() => {
            statusForm.reset({ status: 'BLOCKED', reason: '' })
            setDialog('block')
          }}
          sx={{ minHeight: 44 }}
        >
          Заблокировать
        </AppButton>
        <AppButton
          color="warning"
          variant="outlined"
          onClick={() => {
            statusForm.reset({ status: 'ARCHIVED', reason: '' })
            setDialog('archive')
          }}
          sx={{ minHeight: 44 }}
        >
          Архив
        </AppButton>
      </Stack>
      {!blockCheck.allowed && blockCheck.reason ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {blockCheck.reason}
        </Alert>
      ) : null}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        <Tab label="Данные" />
        <Tab label="Сотрудники" />
        <Tab label="Услуги" />
        <Tab label="Кейсы" />
        <Tab label="Документы" />
        <Tab label="Жалобы" />
        <Tab label="История" />
      </Tabs>

      {tab === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body1">{company.description}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Юр. название: {company.legalName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ОГРН: {company.ogrn}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Сайт: {company.website ?? '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Отрасли: {company.industries.join(', ') || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Технологии: {company.technologies.join(', ') || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Read-only · обновлено {formatDate(company.updatedAt)}
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      {tab === 1 ? (
        <Stack spacing={1}>
          {company.employees.map((e) => (
            <Card key={e.id} variant="outlined">
              <CardContent>
                <Typography variant="h4">{e.name}</Typography>
                <Typography variant="body2">
                  {e.role} · {e.email}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : null}

      {tab === 2 ? (
        <Stack spacing={1}>
          {company.servicesList.map((s) => (
            <Card key={s.id} variant="outlined">
              <CardContent>
                <Typography variant="h4">{s.name}</Typography>
                <Typography variant="body2">{s.description}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : null}

      {tab === 3 ? (
        <Stack spacing={1}>
          {company.cases.map((c) => (
            <Card key={c.id} variant="outlined">
              <CardContent>
                <Typography variant="h4">{c.title}</Typography>
                <Typography variant="body2">
                  {c.client} · {c.year}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : null}

      {tab === 4 ? (
        <Stack spacing={1}>
          {company.documents.map((d) => (
            <Card key={d.id} variant="outlined">
              <CardContent>
                <Typography variant="h4">{d.name}</Typography>
                <Typography variant="body2">
                  {d.type} · {d.status}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : null}

      {tab === 5 ? (
        <Stack spacing={1}>
          {company.reports.length === 0 ? (
            <Typography color="text.secondary">Жалоб нет</Typography>
          ) : (
            company.reports.map((r) => (
              <Card key={r.id} variant="outlined">
                <CardContent>
                  <Typography variant="h4">{r.reason}</Typography>
                  <Typography variant="body2">
                    {r.status} · {formatDate(r.createdAt)}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      ) : null}

      {tab === 6 ? (
        <Stack spacing={1}>
          {company.history.map((h) => (
            <Card key={h.id} variant="outlined">
              <CardContent>
                <Typography variant="h4">{h.title}</Typography>
                <Typography variant="body2">
                  {formatDate(h.date)} · {h.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : null}

      <DangerActionDialog
        open={dialog === 'status'}
        title="Изменить статус компании"
        description="Причина обязательна для audit log."
        confirmLabel="Сохранить"
        loading={updateStatus.isPending}
        onClose={() => setDialog(null)}
        onConfirm={() => void submitStatus()}
      >
        <Controller
          name="status"
          control={statusForm.control}
          render={({ field }) => (
            <AppSelect
              label="Статус"
              value={field.value}
              onChange={field.onChange}
              options={(['ACTIVE', 'SUSPENDED', 'BLOCKED', 'ARCHIVED'] as const).map((s) => ({
                value: s,
                label: PLATFORM_COMPANY_STATUS_LABELS[s] ?? s,
              }))}
              sx={{ mb: 2, mt: 1 }}
            />
          )}
        />
        <Controller
          name="reason"
          control={statusForm.control}
          render={({ field, fieldState }) => (
            <AppTextarea
              {...field}
              label="Причина"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              minRows={3}
            />
          )}
        />
      </DangerActionDialog>

      <DangerActionDialog
        open={dialog === 'verification'}
        title="Изменить verification"
        description="Чувствительные переходы (PENDING→VERIFIED и снятие VERIFIED) требуют причины."
        confirmLabel="Сохранить"
        loading={changeVerification.isPending}
        onClose={() => setDialog(null)}
        onConfirm={() => void submitVerification()}
      >
        <Controller
          name="verificationStatus"
          control={verificationForm.control}
          render={({ field }) => (
            <AppSelect
              label="Verification"
              value={field.value}
              onChange={field.onChange}
              options={(
                [
                  'NOT_VERIFIED',
                  'PENDING',
                  'VERIFIED',
                  'REJECTED',
                  'REQUIRES_UPDATE',
                ] as const
              ).map((s) => ({
                value: s,
                label: VERIFICATION_STATUS_LABELS[s] ?? s,
              }))}
              sx={{ mb: 2, mt: 1 }}
            />
          )}
        />
        <Controller
          name="reason"
          control={verificationForm.control}
          render={({ field, fieldState }) => (
            <AppTextarea
              {...field}
              label="Причина"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              minRows={3}
            />
          )}
        />
      </DangerActionDialog>

      <DangerActionDialog
        open={dialog === 'block'}
        title={`Заблокировать «${company.shortName}»?`}
        description={BLOCK_CONSEQUENCES}
        confirmLabel="Заблокировать"
        loading={block.isPending}
        onClose={() => setDialog(null)}
        onConfirm={() => void submitBlock()}
      >
        <Controller
          name="reason"
          control={statusForm.control}
          render={({ field, fieldState }) => (
            <AppTextarea
              {...field}
              label="Причина"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              minRows={3}
              sx={{ mt: 1 }}
            />
          )}
        />
      </DangerActionDialog>

      <DangerActionDialog
        open={dialog === 'archive'}
        title="Архивировать компанию?"
        description="Архив — конечный статус. Компания исчезнет из активных списков."
        confirmLabel="Архивировать"
        loading={archive.isPending}
        onClose={() => setDialog(null)}
        onConfirm={() => void submitArchive()}
      >
        <Controller
          name="reason"
          control={statusForm.control}
          render={({ field, fieldState }) => (
            <AppTextarea
              {...field}
              label="Причина"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              minRows={3}
              sx={{ mt: 1 }}
            />
          )}
        />
      </DangerActionDialog>
    </Box>
  )
}
