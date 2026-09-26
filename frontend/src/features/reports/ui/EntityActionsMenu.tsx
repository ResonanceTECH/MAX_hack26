import Stack from '@mui/material/Stack'
import type { ReportEntityType } from '@/entities/report'
import { ReportAction } from '@/features/reports/ui/ReportAction'
import { FavoriteButton, ShareButton } from '@/shared/ui'

export interface EntityActionsMenuProps {
  targetType: ReportEntityType
  targetId: string
  targetName: string
  shareTitle: string
  shareText?: string
  shareUrl?: string
  favoriteType?: 'opportunity' | 'company'
  hideFavorite?: boolean
  hideShare?: boolean
  hideReport?: boolean
}

/** Favorite + Share + Report cluster for marketplace detail pages. */
export function EntityActionsMenu({
  targetType,
  targetId,
  targetName,
  shareTitle,
  shareText,
  shareUrl,
  favoriteType,
  hideFavorite = false,
  hideShare = false,
  hideReport = false,
}: EntityActionsMenuProps) {
  return (
    <Stack direction="row" spacing={0.25} alignItems="center">
      {!hideFavorite && favoriteType ? (
        <FavoriteButton type={favoriteType} targetId={targetId} />
      ) : null}
      {!hideShare ? (
        <ShareButton title={shareTitle} text={shareText} url={shareUrl} />
      ) : null}
      {!hideReport ? (
        <ReportAction targetType={targetType} targetId={targetId} targetName={targetName} />
      ) : null}
    </Stack>
  )
}
