import { useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import type { MatchReason } from '@/entities/match'
import { AppIcon } from './AppIcon'
import { InformationCircleIcon } from './icons'
import { MatchExplanation } from './MatchExplanation'

export interface MatchScoreProps {
  score: number
  companyName?: string
  reasons?: MatchReason[]
  missingRequirements?: string[]
  variant?: 'compact' | 'full'
}

export function MatchScore({
  score,
  companyName,
  reasons = [],
  missingRequirements = [],
  variant = 'compact',
}: MatchScoreProps) {
  const [open, setOpen] = useState(false)
  const label = variant === 'full' ? `${score}% совпадения` : `${score}%`

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color="secondary"
        onClick={() => setOpen(true)}
        aria-label={`Match Score ${score} процентов. Подробнее`}
        startIcon={<AppIcon icon={InformationCircleIcon} size={16} />}
        sx={{
          borderRadius: 2,
          fontWeight: 700,
          minHeight: 36,
          bgcolor: 'match.light',
        }}
      >
        {label}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Детали совпадения</DialogTitle>
        <DialogContent>
          <MatchExplanation
            score={score}
            companyName={companyName}
            reasons={reasons}
            missingRequirements={missingRequirements}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
