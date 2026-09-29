import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useFavorites, useToggleFavorite } from '@/features/favorites/api/queries'
import { AppIcon } from './AppIcon'
import { Bookmark02Icon, BookMarkedIcon } from './icons'

export interface FavoriteButtonProps {
  type: 'company' | 'opportunity'
  targetId: string
  size?: 'small' | 'medium'
}

export function FavoriteButton({ type, targetId, size = 'medium' }: FavoriteButtonProps) {
  const { data, isPending: listPending } = useFavorites()
  const toggle = useToggleFavorite()
  const targetKey = String(targetId)
  const active = data?.some((f) => f.type === type && String(f.targetId) === targetKey) ?? false
  const waitingList = listPending && data == null

  return (
    <Tooltip title={active ? 'Убрать из избранного' : 'Сохранить'}>
      <span>
        <IconButton
          size={size}
          disabled={waitingList || toggle.isPending}
          aria-label={active ? 'Убрать из избранного' : 'Сохранить'}
          aria-pressed={active}
          onClick={() => toggle.mutate({ type, targetId: targetKey })}
          sx={{
            minWidth: 44,
            minHeight: 44,
            color: active ? 'secondary.main' : 'text.secondary',
            bgcolor: active ? 'match.light' : 'transparent',
            '&:hover': {
              bgcolor: active ? 'secondary.light' : 'action.hover',
              color: active ? 'secondary.dark' : 'text.primary',
            },
            '&.Mui-disabled': {
              color: active ? 'secondary.main' : 'text.disabled',
              bgcolor: active ? 'match.light' : 'transparent',
            },
          }}
        >
          <AppIcon
            icon={active ? BookMarkedIcon : Bookmark02Icon}
            size={20}
            color="currentColor"
            strokeWidth={active ? 2 : 1.5}
            aria-hidden
          />
        </IconButton>
      </span>
    </Tooltip>
  )
}
