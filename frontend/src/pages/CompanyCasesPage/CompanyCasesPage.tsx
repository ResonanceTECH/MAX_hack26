import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import {
  COMPANY_CASE_STATUS,
  type CompanyCase,
  type CompanyCaseStatus,
} from '@/entities/company-case'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import {
  BaseUiMenu,
  useArchiveCase,
  useCompanyCases,
  useDeleteCase,
  usePublishCase,
  useUpdateCase,
} from '@/features/company-management'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { companyCaseEditPath, companyCasePath, ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  BentoGrid,
  BentoTile,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Tag,
} from '@/shared/ui'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  hidden: 'Скрыт',
  archived: 'В архиве',
}

type TabKey = 'all' | CompanyCaseStatus
type ConfirmKind = { type: 'publish' | 'hide' | 'archive' | 'delete'; item: CompanyCase }

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: COMPANY_CASE_STATUS.PUBLISHED, label: 'Опубликованные' },
  { key: COMPANY_CASE_STATUS.DRAFT, label: 'Черновики' },
  { key: COMPANY_CASE_STATUS.HIDDEN, label: 'Скрытые' },
  { key: COMPANY_CASE_STATUS.ARCHIVED, label: 'Архив' },
]

export function CompanyCasesPage() {
  const companyId = useSessionStore((s) => s.company?.id)
  const { data, isLoading, isError, refetch } = useCompanyCases(companyId)
  const publishCase = usePublishCase(companyId)
  const updateCase = useUpdateCase(companyId)
  const archiveCase = useArchiveCase(companyId)
  const deleteCase = useDeleteCase(companyId)
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [tab, setTab] = useState<TabKey>('all')
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null)

  const filtered = useMemo(() => {
    const list = data ?? []
    if (tab === 'all') return list
    return list.filter((c) => c.status === tab)
  }, [data, tab])

  const runConfirm = async () => {
    if (!confirm) return
    try {
      if (confirm.type === 'publish') {
        await publishCase.mutateAsync(confirm.item.id)
        showSuccess('Кейс опубликован')
      } else if (confirm.type === 'hide') {
        await updateCase.mutateAsync({
          id: confirm.item.id,
          input: { status: COMPANY_CASE_STATUS.HIDDEN },
        })
        showSuccess('Кейс скрыт')
      } else if (confirm.type === 'archive') {
        await archiveCase.mutateAsync(confirm.item.id)
        showSuccess('Кейс в архиве')
      } else {
        await deleteCase.mutateAsync(confirm.item.id)
        showSuccess('Кейс удалён')
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
        title="Кейсы"
        subtitle="Публичные проекты компании"
        actions={
          <AppButton
            component={RouterLink}
            to={ROUTES.PROFILE_COMPANY_CASES_CREATE}
            variant="contained"
          >
            Добавить кейс
          </AppButton>
        }
      />


      <BentoGrid>
        <BentoTile span={12}>
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
          title="Кейсов пока нет"
          actionLabel="Добавить"
          onAction={() => window.location.assign(ROUTES.PROFILE_COMPANY_CASES_CREATE)}
        />
      ) : null}

      <Stack spacing={1.5}>
        {filtered.map((item) => (
          <Box
            key={item.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    component={RouterLink}
                    to={companyCasePath(item.id)}
                    variant="h3"
                    color="inherit"
                    sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                  >
                    {item.title}
                  </Typography>
                  <Chip size="small" label={STATUS_LABELS[item.status] ?? item.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {item.industry}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {item.description}
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  {item.technologies.map((t) => (
                    <Tag key={t} label={t} color="secondary" />
                  ))}
                </Stack>
              </Box>
              <BaseUiMenu
                items={[
                  {
                    key: 'open',
                    label: 'Открыть',
                    onClick: () => window.location.assign(companyCasePath(item.id)),
                  },
                  {
                    key: 'edit',
                    label: 'Изменить',
                    onClick: () => window.location.assign(companyCaseEditPath(item.id)),
                  },
                  ...(item.status !== COMPANY_CASE_STATUS.PUBLISHED
                    ? [
                        {
                          key: 'publish',
                          label: 'Опубликовать',
                          onClick: () => setConfirm({ type: 'publish', item }),
                        },
                      ]
                    : []),
                  ...(item.status !== COMPANY_CASE_STATUS.HIDDEN &&
                  item.status !== COMPANY_CASE_STATUS.ARCHIVED
                    ? [
                        {
                          key: 'hide',
                          label: 'Скрыть',
                          onClick: () => setConfirm({ type: 'hide', item }),
                        },
                      ]
                    : []),
                  {
                    key: 'delete',
                    label: 'Удалить',
                    destructive: true,
                    separatorBefore: true,
                    onClick: () => setConfirm({ type: 'delete', item }),
                  },
                ]}
              />
            </Stack>
          </Box>
        ))}
      </Stack>

        </BentoTile>
      </BentoGrid>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.type === 'delete'
            ? 'Удалить кейс?'
            : confirm?.type === 'publish'
              ? 'Опубликовать кейс?'
              : confirm?.type === 'hide'
                ? 'Скрыть кейс?'
                : 'В архив?'
        }
        description={confirm?.item.title}
        confirmLabel={confirm?.type === 'delete' ? 'Удалить' : 'Подтвердить'}
        destructive={confirm?.type === 'delete' || confirm?.type === 'archive'}
        loading={
          publishCase.isPending ||
          updateCase.isPending ||
          archiveCase.isPending ||
          deleteCase.isPending
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirm()}
      />
    </Box>
  )
}
