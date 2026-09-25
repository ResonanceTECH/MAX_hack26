import { useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useDictionaries,
  useCreateDictionary,
  useUpdateDictionary,
  useArchiveDictionary,
  canArchiveDictionaryItem,
  dictionaryItemSchema,
  type DictionaryItemFormValues,
  DICTIONARY_TYPE_LABELS,
  DangerActionDialog,
} from '@/features/admin'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { ROUTES } from '@/shared/constants/routes'
import type { DictionaryItem, DictionaryType } from '@/shared/mocks/dictionaries'
import {
  AppButton,
  AppInput,
  AppSelect,
  AppTextarea,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/ui'

const SLUG_TO_TYPE: Record<string, DictionaryType> = {
  categories: 'categories',
  industries: 'industries',
  skills: 'skills',
  technologies: 'technologies',
  regions: 'regions',
  'document-types': 'documentTypes',
  documentTypes: 'documentTypes',
  subcategories: 'subcategories',
}

function slugifyLocal(name: string): string {
  return name
    .toLowerCase()
    .replace(/ё/g, 'e')
    .replace(/[^a-z0-9а-я]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function buildTree(items: DictionaryItem[]): { root: DictionaryItem; children: DictionaryItem[] }[] {
  const roots = items.filter((i) => !i.parentId)
  return roots.map((root) => ({
    root,
    children: items.filter((i) => i.parentId === root.id),
  }))
}

export function AdminDictionaryTypePage() {
  const { type: typeParam = 'categories' } = useParams()
  const dictType = SLUG_TO_TYPE[typeParam] ?? 'categories'
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)

  const query = useDictionaries(dictType)
  const create = useCreateDictionary()
  const update = useUpdateDictionary()
  const archive = useArchiveDictionary()

  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<DictionaryItem | null>(null)

  const form = useForm<DictionaryItemFormValues>({
    resolver: zodResolver(dictionaryItemSchema) as Resolver<DictionaryItemFormValues>,
    defaultValues: {
      name: '',
      slug: '',
      type: dictType,
      parentId: null,
      description: '',
      sortOrder: 0,
      status: 'active',
    },
  })

  const items = query.data ?? []
  const tree = useMemo(() => buildTree(items), [items])
  const parents = items.filter((i) => !i.parentId && i.status === 'active')

  const openCreate = () => {
    form.reset({
      name: '',
      slug: '',
      type: dictType,
      parentId: null,
      description: '',
      sortOrder: items.length,
      status: 'active',
    })
    setEditId(null)
    setCreateOpen(true)
  }

  const openEdit = (item: DictionaryItem) => {
    form.reset({
      name: item.name,
      slug: item.slug,
      type: item.type,
      parentId: item.parentId ?? null,
      description: item.description ?? '',
      sortOrder: item.sortOrder,
      status: item.status,
      category: item.category,
    })
    setEditId(item.id)
    setCreateOpen(true)
  }

  const submit = form.handleSubmit(async (values) => {
    try {
      const aliasesRaw = values.aliases ?? ''
      const aliases = aliasesRaw
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
      if (editId) {
        await update.mutateAsync({
          id: editId,
          name: values.name,
          slug: values.slug,
          parentId: values.parentId,
          description: values.description,
          sortOrder: values.sortOrder,
          aliases: aliases.length ? aliases : undefined,
          category: values.category,
        })
        showSuccess('Элемент обновлён')
      } else {
        await create.mutateAsync({
          type: dictType,
          name: values.name,
          slug: values.slug,
          parentId: values.parentId,
          description: values.description,
          sortOrder: values.sortOrder,
          aliases: aliases.length ? aliases : undefined,
          category: values.category,
        })
        showSuccess('Элемент создан')
      }
      setCreateOpen(false)
      setEditId(null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  })

  const renderItemActions = (item: DictionaryItem) => (
    <Stack direction="row" spacing={1}>
      <AppButton size="small" onClick={() => openEdit(item)} sx={{ minHeight: 44 }}>
        Изменить
      </AppButton>
      {item.status === 'active' ? (
        <AppButton
          size="small"
          color="warning"
          onClick={() => setArchiveTarget(item)}
          sx={{ minHeight: 44 }}
        >
          Архив
        </AppButton>
      ) : null}
    </Stack>
  )

  const renderRow = (item: DictionaryItem, depth = 0) => (
    <Card key={item.id} variant="outlined" sx={{ ml: depth * 2 }}>
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1}
          alignItems={{ sm: 'center' }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h4">{item.name}</Typography>
              <Chip
                size="small"
                label={item.status === 'active' ? 'Активен' : 'Архив'}
                color={item.status === 'active' ? 'success' : 'default'}
              />
              <Chip size="small" variant="outlined" label={item.slug} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Использований: {item.usageCount}
              {item.description ? ` · ${item.description}` : ''}
            </Typography>
          </Box>
          {renderItemActions(item)}
        </Stack>
      </CardContent>
    </Card>
  )

  const archiveCheck = archiveTarget ? canArchiveDictionaryItem(archiveTarget) : null

  return (
    <Box>
      <PageHeader
        title={DICTIONARY_TYPE_LABELS[dictType] ?? dictType}
        subtitle="CRUD с audit и предупреждением по usage"
        actions={
          <Stack direction="row" spacing={1}>
            <AppButton
              component={RouterLink}
              to={ROUTES.ADMIN_DICTIONARIES}
              variant="text"
              sx={{ minHeight: 44 }}
            >
              К хабу
            </AppButton>
            <AppButton variant="contained" onClick={openCreate} sx={{ minHeight: 44 }}>
              Создать
            </AppButton>
          </Stack>
        }
      />

      {query.isLoading ? <LoadingState variant="list" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && items.length === 0 ? (
        <EmptyState title="Пусто" description="Создайте первый элемент справочника" />
      ) : null}

      {dictType === 'categories' && !isDesktop ? (
        <Stack spacing={1}>
          {tree.map(({ root, children }) => (
            <Accordion key={root.id} disableGutters>
              <AccordionSummary sx={{ minHeight: 56 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography fontWeight={600}>{root.name}</Typography>
                  <Chip size="small" label={children.length} />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  {renderRow(root)}
                  {children.map((c) => renderRow(c, 1))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      ) : dictType === 'categories' ? (
        <Stack spacing={1}>
          {tree.map(({ root, children }) => (
            <Box key={root.id}>
              {renderRow(root)}
              <Stack spacing={1} sx={{ mt: 1 }}>
                {children.map((c) => renderRow(c, 1))}
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Stack spacing={1}>{items.map((item) => renderRow(item))}</Stack>
      )}

      <DangerActionDialog
        open={createOpen}
        title={editId ? 'Редактировать элемент' : 'Создать элемент'}
        confirmLabel="Сохранить"
        destructive={false}
        loading={create.isPending || update.isPending}
        onClose={() => {
          setCreateOpen(false)
          setEditId(null)
        }}
        onConfirm={() => void submit()}
      >
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <AppInput
              {...field}
              label="Название"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              sx={{ mt: 1, mb: 2 }}
              onChange={(e) => {
                field.onChange(e)
                if (!editId) {
                  form.setValue('slug', slugifyLocal(e.target.value), { shouldValidate: true })
                }
              }}
            />
          )}
        />
        <Controller
          name="slug"
          control={form.control}
          render={({ field, fieldState }) => (
            <AppInput
              {...field}
              label="Slug"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              sx={{ mb: 2 }}
            />
          )}
        />
        {dictType === 'categories' || dictType === 'subcategories' ? (
          <Controller
            name="parentId"
            control={form.control}
            render={({ field }) => (
              <AppSelect
                label="Родительская категория"
                value={field.value ?? ''}
                onChange={(v) => field.onChange(v || null)}
                options={[
                  { value: '', label: 'Без родителя (корень)' },
                  ...parents
                    .filter((p) => p.id !== editId)
                    .map((p) => ({ value: p.id, label: p.name })),
                ]}
                sx={{ mb: 2 }}
              />
            )}
          />
        ) : null}
        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <AppTextarea {...field} label="Описание" minRows={2} sx={{ mb: 2 }} />
          )}
        />
        <Controller
          name="sortOrder"
          control={form.control}
          render={({ field }) => (
            <AppInput
              {...field}
              type="number"
              label="Порядок"
              value={String(field.value ?? 0)}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        />
      </DangerActionDialog>

      <DangerActionDialog
        open={Boolean(archiveTarget)}
        title="Архивировать элемент?"
        description={
          archiveCheck?.warning ??
          'Элемент останется в истории, но не будет доступен для новых сущностей.'
        }
        confirmLabel="Архивировать"
        loading={archive.isPending}
        confirmDisabled={archiveCheck != null && !archiveCheck.allowed}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (!archiveTarget) return
          void archive
            .mutateAsync(archiveTarget.id)
            .then(() => {
              showSuccess('Элемент архивирован')
              setArchiveTarget(null)
            })
            .catch((e: unknown) => showError(e instanceof Error ? e.message : 'Ошибка'))
        }}
      />
    </Box>
  )
}
