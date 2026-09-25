import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import {
  useArchiveDictionary,
  useCreateDictionary,
  useDictionaries,
  useUpdateDictionary,
} from '@/features/admin/api/queries'
import { dictionarySchema, type DictionaryFormValues } from '@/features/admin/model/schemas'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import type { DictionaryType } from '@/shared/mocks/dictionaries'
import { ROUTES } from '@/shared/constants/routes'
import {
  AppButton,
  AppInput,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

const TABS: { key: DictionaryType; label: string }[] = [
  { key: 'categories', label: 'Categories' },
  { key: 'subcategories', label: 'Subcategories' },
  { key: 'industries', label: 'Industries' },
  { key: 'skills', label: 'Skills' },
  { key: 'technologies', label: 'Technologies' },
  { key: 'regions', label: 'Regions' },
  { key: 'documentTypes', label: 'Document types' },
]

export function AdminDictionariesPage() {
  const [tab, setTab] = useState(0)
  const type = TABS[tab]!.key
  const query = useDictionaries(type)
  const create = useCreateDictionary()
  const update = useUpdateDictionary()
  const archive = useArchiveDictionary()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [archiveId, setArchiveId] = useState<string | null>(null)

  const form = useForm<DictionaryFormValues>({
    resolver: zodResolver(dictionarySchema),
    defaultValues: { name: '', type },
  })

  const items = query.data ?? []

  return (
    <Box>
      <PageHeader
        title="Справочники"
        subtitle="Категории, отрасли, навыки и регионы"
        actions={
          <Stack direction="row" spacing={1}>
            <AppButton component={RouterLink} to={ROUTES.ADMIN} variant="text">
              Dashboard
            </AppButton>
            <AppButton
              variant="contained"
              onClick={() => {
                form.reset({ name: '', type })
                setCreateOpen(true)
              }}
            >
              Создать
            </AppButton>
          </Stack>
        }
      />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        {TABS.map((t) => (
          <Tab key={t.key} label={t.label} />
        ))}
      </Tabs>

      {query.isLoading ? <LoadingState variant="list" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && items.length === 0 ? (
        <EmptyState title="Пусто" description="Создайте первый элемент справочника" />
      ) : null}

      <Stack spacing={1}>
        {items.map((item) => (
          <Card key={item.id} variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={1}
                alignItems={{ sm: 'center' }}
              >
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h4">{item.name}</Typography>
                    <Chip
                      size="small"
                      label={item.status === 'active' ? 'Активен' : 'Архив'}
                      color={item.status === 'active' ? 'success' : 'default'}
                    />
                  </Stack>
                  {item.usageCount != null ? (
                    <Typography variant="body2" color="text.secondary">
                      Использований: {item.usageCount}
                    </Typography>
                  ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                  <AppButton
                    size="small"
                    onClick={() => {
                      form.reset({ name: item.name, type: item.type })
                      setEditId(item.id)
                    }}
                  >
                    Изменить
                  </AppButton>
                  {item.status === 'active' ? (
                    <AppButton size="small" color="warning" onClick={() => setArchiveId(item.id)}>
                      Архив
                    </AppButton>
                  ) : null}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog
        open={createOpen || Boolean(editId)}
        onClose={() => {
          setCreateOpen(false)
          setEditId(null)
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editId ? 'Редактировать' : 'Создать элемент'}</DialogTitle>
        <DialogContent>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <AppInput
                {...field}
                label="Название"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                sx={{ mt: 1 }}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton
            onClick={() => {
              setCreateOpen(false)
              setEditId(null)
            }}
          >
            Отмена
          </AppButton>
          <AppButton
            variant="contained"
            onClick={() =>
              void form.handleSubmit(async (values) => {
                if (editId) {
                  await update.mutateAsync({ id: editId, name: values.name })
                  showSuccess('Элемент обновлён')
                } else {
                  await create.mutateAsync({ type, name: values.name })
                  showSuccess('Категория создана')
                }
                setCreateOpen(false)
                setEditId(null)
              })()
            }
          >
            Сохранить
          </AppButton>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(archiveId)}
        title="Архивировать элемент?"
        description="Элемент останется в истории, но не будет доступен для новых сущностей. Удаление используемых элементов недоступно."
        confirmLabel="Архивировать"
        destructive
        onCancel={() => setArchiveId(null)}
        onConfirm={() => {
          if (!archiveId) return
          void archive.mutateAsync(archiveId).then(() => {
            showSuccess('Элемент архивирован')
            setArchiveId(null)
          })
        }}
      />
    </Box>
  )
}
