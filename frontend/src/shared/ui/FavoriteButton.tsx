import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useFavorites, useToggleFavorite } from '@/features/favorites/api/queries'
import { AppIcon } from './AppIcon'
import { Bookmark02Icon, FavouriteIcon } from './icons'

export interface FavoriteButtonProps {
  type: 'company' | 'opportunity'
  targetId: string
  size?: 'small' | 'medium'
}

export function FavoriteButton({ type, targetId, size = 'medium' }: FavoriteButtonProps) {
  const { data } = useFavorites()
  const toggle = useToggleFavorite()
  const active = data?.some((f) => f.type === type && f.targetId === targetId) ?? false

  return (
    <Tooltip title={active ? 'Убрать из избранного' : 'Сохранить'}>
      <IconButton
        size={size}
        color={active ? 'secondary' : 'default'}
        aria-label={active ? 'Убрать из избранного' : 'Сохранить'}
        aria-pressed={active}
        onClick={() => toggle.mutate({ type, targetId })}
        sx={{ minWidth: 44, minHeight: 44 }}
      >
        <AppIcon icon={active ? FavouriteIcon : Bookmark02Icon} size={20} />
      </IconButton>
    </Tooltip>
  )
}
