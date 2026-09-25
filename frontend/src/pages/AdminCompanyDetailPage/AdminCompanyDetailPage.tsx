import { useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import {
  useAdminCompany,
  useBlockCompany,
  useSendCompanyToModeration,
  useUpdateCompanyStatus,
} from '@/features/admin/api/queries'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import type { PlatformCompanyStatus } from '@/shared/api/adminCompaniesApi'
import { ROUTES } from '@/shared/constants/routes'
import { formatDate } from '@/shared/lib/format'
import {
  AppButton,
  AppSelect,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

export function AdminCompanyDetailPage() {
  const { id = '' } = useParams()
  const query = useAdminCompany(id)
  const updateStatus = useUpdateCompanyStatus()
  const sendMod = useSendCompanyToModeration()
  const block = useBlockCompany()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const [blockOpen, setBlockOpen] = useState(false)
  const [tab, setTab] = useState(0)

  if (query.isLoading) return <LoadingState variant="page" />
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />

  const company = query.data

  return (
    <Box>
      <PageHeader
        title={company.name}
        subtitle={`ИНН ${company.inn} · ${company.region}`}
        actions={
          <AppButton component={RouterLink} to={ROUTES.ADMIN_COMPANIES} variant="text">
            К списку
          </AppButton>
        }
      />
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Chip label={company.platformStatus} size="small" />
        <Chip label={company.verificationStatus} size="small" variant="outlined" />
        <Chip label={`${company.employeesCount} сотрудников`} size="small" />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <AppSelect
          label="Статус платформы"
          value={company.platformStatus}
          onChange={(v) =>
            void updateStatus
              .mutateAsync({ id: company.id, status: v as PlatformCompanyStatus })
              .then(() => showSuccess('Статус компании обновлён'))
          }
          options={[
            { value: 'active', label: 'active' },
            { value: 'pending_moderation', label: 'pending_moderation' },
            { value: 'blocked', label: 'blocked' },
            { value: 'suspended', label: 'suspended' },
          ]}
        />
        <AppButton
          variant="outlined"
          onClick={() =>
            void sendMod.mutateAsync(company.id).then(() => showSuccess('Отправлено на проверку'))
          }
        >
          Отправить на проверку
        </AppButton>
        <AppButton color="error" variant="outlined" onClick={() => setBlockOpen(true)}>
          Заблокировать
        </AppButton>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2 }}>
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Сайт: {company.website ?? '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Platform Admin не редактирует коммерческие поля компании.
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
                <Typography variant="body2">{e.role} · {e.email}</Typography>
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
                <Typography variant="body2">{c.client} · {c.year}</Typography>
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
                <Typography variant="body2">{d.type} · {d.status}</Typography>
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

      <ConfirmDialog
        open={blockOpen}
        title={`Заблокировать компанию «${company.shortName}»?`}
        description="Пользователи компании временно потеряют доступ к операциям платформы."
        confirmLabel="Заблокировать"
        destructive
        onCancel={() => setBlockOpen(false)}
        onConfirm={() => {
          void block.mutateAsync(company.id).then(() => {
            showSuccess('Компания заблокирована')
            setBlockOpen(false)
          })
        }}
      />
    </Box>
  )
}
