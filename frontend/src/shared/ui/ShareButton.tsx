import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { getMaxBridge } from '@/shared/lib/max'
import { AppIcon } from './AppIcon'
import { Share08Icon } from './icons'

export interface ShareButtonProps {
  title: string
  text?: string
  url?: string
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  return (
    <Tooltip title="Поделиться">
      <IconButton
        aria-label="Поделиться"
        onClick={() => {
          void getMaxBridge().shareContent({
            title,
            text,
            url: url ?? window.location.href,
          })
        }}
        sx={{ minWidth: 44, minHeight: 44 }}
      >
        <AppIcon icon={Share08Icon} size={20} />
      </IconButton>
    </Tooltip>
  )
}
