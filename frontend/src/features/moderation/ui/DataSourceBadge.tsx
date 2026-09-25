import Chip from '@mui/material/Chip'
import type { DataOrigin } from '@/entities/moderation'
import { DATA_ORIGIN_LABELS } from '../model/labels'

export function DataSourceBadge({ origin }: { origin: DataOrigin }) {
  return <Chip size="small" variant="outlined" label={DATA_ORIGIN_LABELS[origin]} />
}
