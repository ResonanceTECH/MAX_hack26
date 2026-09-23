import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'

export interface SortOption<T extends string> {
  value: T
  label: string
}

export interface SortSelectProps<T extends string> {
  value: T
  options: SortOption<T>[]
  onChange: (value: T) => void
  label?: string
}

export function SortSelect<T extends string>({
  value,
  options,
  onChange,
  label = 'Сортировка',
}: SortSelectProps<T>) {
  return (
    <TextField
      select
      fullWidth
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  )
}
