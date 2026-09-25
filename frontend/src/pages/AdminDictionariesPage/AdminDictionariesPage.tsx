import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useDictionaries, DICTIONARY_TYPE_LABELS } from '@/features/admin'
import { adminDictionaryPath, ROUTES } from '@/shared/constants/routes'
import type { DictionaryType } from '@/shared/mocks/dictionaries'
import { AppButton, LoadingState, PageHeader } from '@/shared/ui'

const HUB: { type: DictionaryType; path: string; description: string }[] = [
  {
    type: 'categories',
    path: ROUTES.ADMIN_DICTIONARIES_CATEGORIES,
    description: 'Дерево категорий и подкатегорий запросов',
  },
  {
    type: 'industries',
    path: ROUTES.ADMIN_DICTIONARIES_INDUSTRIES,
    description: 'Отрасли компаний',
  },
  {
    type: 'skills',
    path: ROUTES.ADMIN_DICTIONARIES_SKILLS,
    description: 'Компетенции и навыки',
  },
  {
    type: 'technologies',
    path: ROUTES.ADMIN_DICTIONARIES_TECHNOLOGIES,
    description: 'Технологический стек',
  },
  {
    type: 'regions',
    path: ROUTES.ADMIN_DICTIONARIES_REGIONS,
    description: 'Регионы присутствия',
  },
  {
    type: 'documentTypes',
    path: ROUTES.ADMIN_DICTIONARIES_DOCUMENT_TYPES,
    description: 'Типы документов для верификации',
  },
]

export function AdminDictionariesPage() {
  const all = useDictionaries()

  return (
    <Box>
      <PageHeader
        title="Справочники"
        subtitle="Управление словарями платформы"
        actions={
          <AppButton component={RouterLink} to={ROUTES.ADMIN} variant="text" sx={{ minHeight: 44 }}>
            К сводке
          </AppButton>
        }
      />

      {all.isLoading ? <LoadingState rows={2} /> : null}

      <Grid container spacing={1.5}>
        {HUB.map((item) => {
          const count =
            all.data?.filter((d) => d.type === item.type && d.status === 'active').length ?? 0
          return (
            <Grid key={item.type} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardActionArea
                  component={RouterLink}
                  to={item.path}
                  sx={{ height: '100%', alignItems: 'stretch' }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h4">
                        {DICTIONARY_TYPE_LABELS[item.type] ?? item.type}
                      </Typography>
                      <Chip size="small" label={count} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        Быстрые ссылки:{' '}
        {HUB.map((h, i) => (
          <span key={h.type}>
            {i > 0 ? ' · ' : null}
            <Typography
              component={RouterLink}
              to={adminDictionaryPath(
                h.type === 'documentTypes' ? 'document-types' : h.type,
              )}
              variant="body2"
              color="primary"
              sx={{ textDecoration: 'none' }}
            >
              {DICTIONARY_TYPE_LABELS[h.type]}
            </Typography>
          </span>
        ))}
      </Typography>
    </Box>
  )
}
