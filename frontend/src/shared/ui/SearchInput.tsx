import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { AppIcon } from './AppIcon'
import { Search01Icon } from './icons'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  'aria-label'?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Поиск',
  label = 'Поиск',
  'aria-label': ariaLabel,
}: SearchInputProps) {
  return (
    <TextField
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      label={label}
      aria-label={ariaLabel ?? label}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <AppIcon icon={Search01Icon} size={18} aria-hidden />
          </InputAdornment>
        ),
      }}
    />
  )
}
