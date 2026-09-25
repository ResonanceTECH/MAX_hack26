import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { AppIcon } from '@/shared/ui'
import { CheckmarkCircle01Icon } from '@/shared/ui/icons'

export function ModerationChecklist({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Чеклист проверки
      </Typography>
      <List dense disablePadding>
        {items.map((text) => (
          <ListItem key={text} disableGutters sx={{ py: 0.25 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <AppIcon icon={CheckmarkCircle01Icon} size={18} />
            </ListItemIcon>
            <ListItemText primary={text} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        ))}
      </List>
    </>
  )
}
