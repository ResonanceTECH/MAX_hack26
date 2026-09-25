import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import {
  COMPANY_SERVICE_STATUS,
  type CompanyService,
  type CompanyServiceStatus,
} from '@/entities/company-service'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  BaseUiMenu,
  useArchiveService,
  useCompanyServices,
  useHideService,
  usePublishService,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import {
  companyServiceEditPath,
  companyServicePath,
  ROUTES,
} from '@/shared/constants/routes'
import {
  AppButton,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  active: 'Активна',
  hidden: 'Скрыта',
  archived: 'В архиве',
}

type TabKey = 'all' | CompanyServiceStatus
type ConfirmKind = { type: 'publish' | 'hide' | 'archive'; service: CompanyService }

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: COMPANY_SERVICE_STATUS.ACTIVE, label: 'Активные' },
  { key: COMPANY_SERVICE_STATUS.DRAFT, label: 'Черновики' },
  { key: COMPANY_SERVICE_STATUS.HIDDEN, label: 'Скрытые' },
  { key: COMPANY_SERVICE_STATUS.ARCHIVED, label: 'Архив' },
]

export function CompanyServicesPage() {
  const companyId = useSessionStore((s) => s.company?.id)
  const { data, isLoading, isError, refetch } = useCompanyServices(companyId)
  const publishService = usePublishService(companyId)
  const hideService = useHideService(companyId)
  const archiveService = useArchiveService(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [tab, setTab] = useState<TabKey>('all')
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null)

  const filtered = useMemo(() => {
    const list = data ?? []
    if (tab === 'all') return list
    return list.filter((s) => s.status === tab)
  }, [data, tab])

  const runConfirm = async () => {
    if (!confirm) return
    try {
      if (confirm.type === 'publish') {
        await publishService.mutateAsync(confirm.service.id)
        showSuccess('Услуга опубликована')
      } else if (confirm.type === 'hide') {
        await hideService.mutateAsync(confirm.service.id)
        showSuccess('Услуга скрыта')
      } else {
        await archiveService.mutateAsync(confirm.service.id)
        showSuccess('Услуга в архиве')
      }
      setConfirm(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка')
      setConfirm(null)
    }
  }

  return (
    <Box>
      <PageHeader
        title="Услуги"
        subtitle="Каталог услуг компании"
        actions={
          <AppButton
            component={RouterLink}
            to={ROUTES.PROFILE_COMPANY_SERVICES_CREATE}
            variant="contained"
          >
            Создать услугу
          </AppButton>
        }
      />

      <Tabs
        value={TABS.findIndex((t) => t.key === tab)}
        onChange={(_, i: number) => setTab(TABS[i]!.key)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((t) => (
          <Tab key={t.key} label={t.label} />
        ))}
      </Tabs>

      {isLoading ? <LoadingState variant="cards" /> : null}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && filtered.length === 0 ? (
        <EmptyState
          title="Услуг пока нет"
          description="Создайте первую услугу для каталога."
          actionLabel="Создать"
          onAction={() => {
            window.location.assign(ROUTES.PROFILE_COMPANY_SERVICES_CREATE)
          }}
        />
      ) : null}

      <Stack spacing={1.5}>
        {filtered.map((service) => (
          <Box
            key={service.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              spacing={1}
            >
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    component={RouterLink}
                    to={companyServicePath(service.id)}
                    variant="h3"
                    color="inherit"
                    sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                  >
                    {service.title}
                  </Typography>
                  <Chip size="small" label={STATUS_LABELS[service.status] ?? service.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {service.category}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {service.shortDescription || service.description}
                </Typography>
              </Box>
              <BaseUiMenu
                items={[
                  {
                    key: 'open',
                    label: 'Открыть',
                    onClick: () => window.location.assign(companyServicePath(service.id)),
                  },
                  {
                    key: 'edit',
                    label: 'Изменить',
                    onClick: () => window.location.assign(companyServiceEditPath(service.id)),
                  },
                  ...(service.status !== COMPANY_SERVICE_STATUS.ACTIVE
                    ? [
                        {
                          key: 'publish',
                          label: 'Опубликовать',
                          onClick: () => setConfirm({ type: 'publish', service }),
                        },
                      ]
                    : []),
                  ...(service.status !== COMPANY_SERVICE_STATUS.HIDDEN &&
                  service.status !== COMPANY_SERVICE_STATUS.ARCHIVED
                    ? [
                        {
                          key: 'hide',
                          label: 'Скрыть',
                          onClick: () => setConfirm({ type: 'hide', service }),
                        },
                      ]
                    : []),
                  ...(service.status !== COMPANY_SERVICE_STATUS.ARCHIVED
                    ? [
                        {
                          key: 'archive',
                          label: 'В архив',
                          destructive: true,
                          separatorBefore: true,
                          onClick: () => setConfirm({ type: 'archive', service }),
                        },
                      ]
                    : []),
                ]}
              />
            </Stack>
          </Box>
        ))}
      </Stack>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.type === 'publish'
            ? 'Опубликовать услугу?'
            : confirm?.type === 'hide'
              ? 'Скрыть услугу?'
              : 'Отправить в архив?'
        }
        description={confirm?.service.title}
        confirmLabel={
          confirm?.type === 'publish'
            ? 'Опубликовать'
            : confirm?.type === 'hide'
              ? 'Скрыть'
              : 'В архив'
        }
        destructive={confirm?.type === 'archive'}
        loading={publishService.isPending || hideService.isPending || archiveService.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirm()}
      />
    </Box>
  )
}
