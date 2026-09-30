import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useSnackbarStore } from '@/features/ui/model/snackbarStore'
import { getMaxBridge } from '@/shared/lib/max'
import { AppIcon } from './AppIcon'
import { Share08Icon } from './icons'

export interface ShareButtonProps {
  title: string
  text?: string
  url?: string
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const showInfo = useSnackbarStore((s) => s.showInfo)

  return (
    <Tooltip title="Поделиться">
      <IconButton
        aria-label="Поделиться"
        onClick={() => {
          void getMaxBridge()
            .shareContent({
              title,
              text,
              url: url ?? window.location.href,
            })
            .then((result) => {
              if (result === 'clipboard') {
                showSuccess('Ссылка скопирована')
                return
              }
              if (result === 'share') {
                showInfo('Готово')
                return
              }
              if (result === 'error') {
                showError('Не удалось поделиться')
              }
              // noop = пользователь отменил share sheet — без тоста
            })
            .catch(() => {
              showError('Не удалось поделиться')
            })
        }}
        sx={{ minWidth: 44, minHeight: 44, color: 'text.secondary' }}
      >
        <AppIcon icon={Share08Icon} size={20} color="currentColor" />
      </IconButton>
    </Tooltip>
  )
}
