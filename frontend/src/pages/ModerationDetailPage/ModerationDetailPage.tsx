import { useMemo, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import {
  useApproveModerationItem,
  useAssignModerationItem,
  useBlockModerationItem,
  useEscalateModerationItem,
  useModerationItem,
  useModerationRelatedData,
  useRejectModerationItem,
  useRequestModerationChanges,
} from '@/features/moderation/api/queries'
import {
  canApproveItem,
  canAssignItem,
  canBlockItem,
  canEscalateItem,
  canRejectItem,
  canRequestChanges,
} from '@/features/moderation/model/businessRules'
import {
  COMPANY_CHANGE_FIELDS,
  COMPANY_REJECT_REASONS,
  ESCALATION_REASON_LABELS,
  GENERIC_REJECT_REASONS,
  MODERATION_ACTION_LABELS,
  MODERATION_REASON_LABELS,
  MODERATION_TYPE_LABELS,
  OPPORTUNITY_CHANGE_FIELDS,
  OPPORTUNITY_REJECT_REASONS,
} from '@/features/moderation/model/labels'
import { useQueueFiltersStore } from '@/features/moderation/model/queueFiltersStore'
import {
  BlockDialog,
  EscalateDialog,
  RejectDialog,
  RequestChangesDialog,
} from '@/features/moderation/ui/DecisionDialogs'
import { DataSourceBadge } from '@/features/moderation/ui/DataSourceBadge'
import { DiffViewer } from '@/features/moderation/ui/DiffViewer'
import { ModerationChecklist } from '@/features/moderation/ui/ModerationChecklist'
import { ModerationDecisionPanel } from '@/features/moderation/ui/ModerationDecisionPanel'
import { ModerationPriorityChip } from '@/features/moderation/ui/ModerationPriorityChip'
import { ModerationStatusChip } from '@/features/moderation/ui/ModerationStatusChip'
import { LongWaitAlert, QueueAgeLabel } from '@/features/moderation/ui/QueueAgeLabel'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { moderationApi } from '@/shared/api/moderationApi'
import { formatDate } from '@/shared/lib/format'
import {
  companyDetailsPath,
  moderationItemPath,
  moderationReportPath,
  ROUTES,
} from '@/shared/constants/routes'
import {
  AppButton,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'
import { ESCALATION_REASON } from '@/entities/escalation'
import { VERSION_CONFLICT_MESSAGE } from '@/entities/moderation'

export function ModerationDetailPage() {
  const params = useParams()
  const location = useLocation()
  const id = params.id ?? ''
  const type =
    params.type ??
    (location.pathname.includes('/moderation/company/')
      ? 'company'
      : location.pathname.includes('/moderation/opportunity/')
        ? 'opportunity'
        : location.pathname.includes('/moderation/case/')
          ? 'case'
          : location.pathname.includes('/moderation/document/')
            ? 'document'
            : 'item')
  const navigate = useNavigate()
  const query = useModerationItem(type, id)
  const related = useModerationRelatedData(query.data?.id)
  const openNext = useQueueFiltersStore((s) => s.openNextAfterDecision)
  const filters = useQueueFiltersStore()

  const approve = useApproveModerationItem()
  const reject = useRejectModerationItem()
  const requestChanges = useRequestModerationChanges()
  const block = useBlockModerationItem()
  const escalate = useEscalateModerationItem()
  const assign = useAssignModerationItem()

  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [changesOpen, setChangesOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [escalateOpen, setEscalateOpen] = useState(false)
  const [tab, setTab] = useState(0)
  const [conflict, setConflict] = useState(false)

  const item = query.data
  const loading =
    approve.isPending ||
    reject.isPending ||
    requestChanges.isPending ||
    block.isPending ||
    escalate.isPending ||
    assign.isPending

  const rejectReasons = useMemo(() => {
    if (!item) return GENERIC_REJECT_REASONS
    if (item.entityType === 'company') return COMPANY_REJECT_REASONS
    if (item.entityType === 'opportunity') return OPPORTUNITY_REJECT_REASONS
    return GENERIC_REJECT_REASONS
  }, [item])

  const changeFields = useMemo(() => {
    if (!item) return COMPANY_CHANGE_FIELDS
    if (item.entityType === 'opportunity') return OPPORTUNITY_CHANGE_FIELDS
    return COMPANY_CHANGE_FIELDS
  }, [item])

  const afterDecision = async (doneId: string) => {
    if (openNext) {
      const next = await moderationApi.getNextItem(doneId, {
        type: filters.type,
        status: 'open',
        sort: filters.sort,
      })
      if (next) {
        navigate(moderationItemPath(next.entityType, next.id))
        return
      }
    }
    navigate(ROUTES.MODERATION_QUEUE)
  }

  const handleError = (err: unknown) => {
    const e = err as Error & { status?: number; code?: string }
    const msg = e instanceof Error ? e.message : 'Не удалось сохранить решение'
    const isConflict =
      e?.status === 409 ||
      e?.code === 'version_conflict' ||
      e?.code === 'conflict' ||
      msg.includes('изменён') ||
      msg.includes('Версия устарела')
    if (isConflict) {
      setConflict(true)
      showError(VERSION_CONFLICT_MESSAGE)
      return
    }
    showError(msg)
  }

  if (query.isLoading) return <LoadingState variant="page" />
  if (query.isError || !item) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Объект не найден
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Возможно, он уже удалён или ссылка устарела.
        </Typography>
        <AppButton component={RouterLink} to={ROUTES.MODERATION_QUEUE} variant="contained">
          К очереди
        </AppButton>
        <Box sx={{ mt: 2 }}>
          <ErrorState onRetry={() => void query.refetch()} />
        </Box>
      </Box>
    )
  }

  const guards = {
    assign: canAssignItem(item),
    approve: canApproveItem(item),
    reject: canRejectItem(item),
    changes: canRequestChanges(item),
    block: canBlockItem(item),
    escalate: canEscalateItem(item),
  }

  const canDecide =
    item.status === 'PENDING' ||
    item.status === 'IN_REVIEW' ||
    item.status === 'NEEDS_CHANGES'

  const approveLabel =
    item.entityType === 'document' ? 'Подтвердить' : 'Одобрить'

  return (
    <Box sx={{ pb: { xs: 18, md: 2 } }}>
      <PageHeader
        title={item.title}
        subtitle={`${MODERATION_TYPE_LABELS[item.entityType]} · ${item.companyName}`}
      />

      {conflict ? (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <AppButton size="small" onClick={() => void query.refetch().then(() => setConflict(false))}>
              Обновить
            </AppButton>
          }
        >
          Объект был изменён другим пользователем. Обновите данные.
        </Alert>
      ) : null}

      <LongWaitAlert submittedAt={item.submittedAt} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Chip size="small" label={MODERATION_TYPE_LABELS[item.entityType]} />
              <ModerationStatusChip status={item.status} />
              <ModerationPriorityChip priority={item.priority} />
              <DataSourceBadge origin={item.dataOrigin} />
            </Stack>

            <Typography variant="body1">{item.summary}</Typography>
            <Typography variant="body2" color="text.secondary">
              Причина модерации: {MODERATION_REASON_LABELS[item.reason]}
            </Typography>
            <QueueAgeLabel submittedAt={item.submittedAt} />
            {item.assignedModeratorName ? (
              <Typography variant="body2">
                Назначен: {item.assignedModeratorName}
              </Typography>
            ) : null}
            {item.reportsCount > 0 ? (
              <Alert severity="info">
                На объект поступило {item.reportsCount}{' '}
                {item.reportsCount === 1 ? 'жалоба' : 'жалобы'}.
              </Alert>
            ) : null}

            {item.automatedFlags.length > 0 ? (
              <Alert severity="warning">
                Автоматическая проверка отметила:{' '}
                {item.automatedFlags.join('; ')}. Это модельное правило.
              </Alert>
            ) : null}

            {item.relatedReportIds[0] ? (
              <AppButton
                component={RouterLink}
                to={moderationReportPath(item.relatedReportIds[0])}
                variant="text"
                size="small"
              >
                Связано с жалобой #{item.relatedReportIds[0]}
              </AppButton>
            ) : null}

            {item.previousSnapshot && item.currentSnapshot ? (
              <Card variant="outlined">
                <CardContent>
                  <Chip size="small" label="Повторная проверка" sx={{ mb: 1.5 }} color="warning" />
                  <DiffViewer before={item.previousSnapshot} after={item.currentSnapshot} />
                </CardContent>
              </Card>
            ) : null}

            <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="scrollable">
              <Tab label="Сводка" />
              <Tab label="Чеклист" />
              <Tab label="Жалобы" />
              <Tab label="История" />
              {item.entityType === 'company' ? <Tab label="Превью" /> : null}
            </Tabs>

            {tab === 0 ? (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" gutterBottom>
                    Данные объекта
                  </Typography>
                  <Stack spacing={0.75}>
                    {Object.entries(item.payload).map(([key, value]) => (
                      <Typography key={key} variant="body2">
                        <strong>{key}:</strong> {String(value ?? '—')}
                      </Typography>
                    ))}
                    {item.documentStatus ? (
                      <Typography variant="body2">
                        <strong>document status:</strong> {item.documentStatus}
                      </Typography>
                    ) : null}
                    <Typography variant="body2" color="text.secondary">
                      Подано: {formatDate(item.submittedAt)} · Владелец: {item.ownerName}
                    </Typography>
                  </Stack>
                  {item.entityType === 'document' ? (
                    <Box
                      sx={{
                        mt: 2,
                        p: 3,
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Превью файла (модельные данные)
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {String(item.payload.fileName ?? 'file.pdf')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {String(item.payload.mimeType ?? '')} · {String(item.payload.fileSize ?? '')}
                      </Typography>
                    </Box>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {tab === 1 ? (
              <Card variant="outlined">
                <CardContent>
                  <ModerationChecklist items={item.checklist} />
                </CardContent>
              </Card>
            ) : null}

            {tab === 2 ? (
              <Card variant="outlined">
                <CardContent>
                  {(related.data?.relatedReports.length ?? 0) === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Связанных жалоб нет.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {related.data?.relatedReports.map((r) => (
                        <Box key={r.id}>
                          <AppButton
                            component={RouterLink}
                            to={moderationReportPath(r.id)}
                            variant="text"
                            size="small"
                          >
                            {r.type} · {r.status}
                          </AppButton>
                          <Typography variant="body2">{r.description}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                  {related.data?.companyRisk ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Контекст: прошлых отклонений {related.data.companyRisk.previousRejections},
                      заблокированных объектов {related.data.companyRisk.blockedItems}
                    </Typography>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {tab === 3 ? (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    {(related.data?.history ?? []).map((h) => (
                      <Box key={h.id}>
                        <Typography variant="subtitle2">
                          {MODERATION_ACTION_LABELS[h.decision.action]} ·{' '}
                          {h.decision.moderatorName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {h.decision.previousStatus} → {h.decision.newStatus} ·{' '}
                          {formatDate(h.decision.createdAt)}
                        </Typography>
                        {h.decision.comment ? (
                          <Typography variant="body2">{h.decision.comment}</Typography>
                        ) : null}
                        {h.decision.privateNote ? (
                          <Typography variant="caption" color="text.secondary">
                            Приватная заметка: {h.decision.privateNote}
                          </Typography>
                        ) : null}
                      </Box>
                    ))}
                    {(related.data?.history.length ?? 0) === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Полный журнал решений по объекту пока недоступен на backend. Показан
                        только текущий статус.
                      </Typography>
                    ) : null}
                  </Stack>
                </CardContent>
              </Card>
            ) : null}

            {tab === 4 && item.entityType === 'company' ? (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" gutterBottom>
                    Как видит пользователь
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Read-only preview. Редактирование недоступно модератору.
                  </Typography>
                  <Typography variant="h3">{item.title}</Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {String(item.payload.description ?? '')}
                  </Typography>
                  <AppButton
                    component={RouterLink}
                    to={companyDetailsPath(item.entityId)}
                    variant="outlined"
                    sx={{ mt: 2 }}
                  >
                    Открыть публичную карточку
                  </AppButton>
                </CardContent>
              </Card>
            ) : null}

            {item.status === 'NEEDS_CHANGES' ? (
              <Alert severity="info">
                Ожидается исправление владельцем. Повторная отправка выполняется из кабинета
                владельца объекта.
              </Alert>
            ) : null}

            <AppButton component={RouterLink} to={ROUTES.MODERATION_QUEUE} variant="text">
              К очереди
            </AppButton>
          </Stack>
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
          {canDecide ? (
            <ModerationDecisionPanel
              loading={loading}
              canAssign={guards.assign.allowed}
              canApprove={guards.approve.allowed}
              canReject={guards.reject.allowed}
              canRequestChanges={guards.changes.allowed}
              canBlock={guards.block.allowed}
              canEscalate={guards.escalate.allowed}
              onAssign={() =>
                void assign
                  .mutateAsync(item.id)
                  .then(() => showSuccess('Объект взят в работу'))
                  .catch(handleError)
              }
              onApprove={() => setApproveOpen(true)}
              onReject={() => setRejectOpen(true)}
              onRequestChanges={() => setChangesOpen(true)}
              onBlock={() => setBlockOpen(true)}
              onEscalate={() => setEscalateOpen(true)}
              approveLabel={approveLabel}
            />
          ) : (
            <Alert severity="info">Решения по этому статусу недоступны.</Alert>
          )}
        </Grid>
      </Grid>

      {canDecide ? (
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <ModerationDecisionPanel
            loading={loading}
            canAssign={guards.assign.allowed}
            canApprove={guards.approve.allowed}
            canReject={guards.reject.allowed}
            canRequestChanges={guards.changes.allowed}
            canBlock={guards.block.allowed}
            canEscalate={guards.escalate.allowed}
            onAssign={() =>
              void assign
                .mutateAsync(item.id)
                .then(() => showSuccess('Объект взят в работу'))
                .catch(handleError)
            }
            onApprove={() => setApproveOpen(true)}
            onReject={() => setRejectOpen(true)}
            onRequestChanges={() => setChangesOpen(true)}
            onBlock={() => setBlockOpen(true)}
            onEscalate={() => setEscalateOpen(true)}
            approveLabel={approveLabel}
          />
        </Box>
      ) : null}

      <ConfirmDialog
        open={approveOpen}
        title={`${approveLabel} «${item.title}»?`}
        description="Объект получит статус APPROVED. Отменить решение через Undo нельзя."
        confirmLabel={approveLabel}
        loading={approve.isPending}
        onCancel={() => setApproveOpen(false)}
        onConfirm={() => {
          void approve
            .mutateAsync({ id: item.id, input: { expectedVersion: item.version } })
            .then(async () => {
              showSuccess(
                item.entityType === 'document' ? 'Документ подтверждён' : 'Объект одобрен',
              )
              setApproveOpen(false)
              await afterDecision(item.id)
            })
            .catch(handleError)
        }}
      />

      <RejectDialog
        open={rejectOpen}
        title={`Отклонить «${item.title}»`}
        reasons={rejectReasons}
        loading={reject.isPending}
        onClose={() => setRejectOpen(false)}
        onSubmit={async (values) => {
          try {
            await reject.mutateAsync({
              id: item.id,
              input: { ...values, expectedVersion: item.version },
            })
            showSuccess(
              item.entityType === 'opportunity' ? 'Запрос отклонён' : 'Объект отклонён',
            )
            setRejectOpen(false)
            await afterDecision(item.id)
          } catch (e) {
            handleError(e)
          }
        }}
      />

      <RequestChangesDialog
        open={changesOpen}
        title={`Запросить исправления для «${item.title}»`}
        fields={changeFields}
        loading={requestChanges.isPending}
        onClose={() => setChangesOpen(false)}
        onSubmit={async (values) => {
          try {
            await requestChanges.mutateAsync({
              id: item.id,
              input: { ...values, expectedVersion: item.version },
            })
            showSuccess('Исправления запрошены')
            setChangesOpen(false)
            await afterDecision(item.id)
          } catch (e) {
            handleError(e)
          }
        }}
      />

      <BlockDialog
        open={blockOpen}
        title={`Заблокировать «${item.title}»?`}
        loading={block.isPending}
        onClose={() => setBlockOpen(false)}
        onSubmit={async (values) => {
          try {
            await block.mutateAsync({
              id: item.id,
              input: { ...values, expectedVersion: item.version },
            })
            showSuccess('Объект заблокирован')
            setBlockOpen(false)
            await afterDecision(item.id)
          } catch (e) {
            handleError(e)
          }
        }}
      />

      <EscalateDialog
        open={escalateOpen}
        title="Передать Platform Admin"
        reasons={Object.entries(ESCALATION_REASON_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
        loading={escalate.isPending}
        onClose={() => setEscalateOpen(false)}
        onSubmit={async (values) => {
          try {
            await escalate.mutateAsync({
              id: item.id,
              input: {
                reasonCode: values.reasonCode || ESCALATION_REASON.OTHER,
                comment: values.comment,
                expectedVersion: item.version,
              },
            })
            showSuccess('Случай передан администратору')
            setEscalateOpen(false)
            navigate(ROUTES.MODERATION_ESCALATIONS)
          } catch (e) {
            handleError(e)
          }
        }}
      />
    </Box>
  )
}
