import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent, type SelectProps } from '@mui/material/Select'

export interface AppSelectOption {
  value: string
  label: string
}

export interface AppSelectProps extends Omit<SelectProps<string>, 'onChange'> {
  label: string
  options: AppSelectOption[]
  helperText?: string
  error?: boolean
  onChange?: (value: string) => void
}

export function AppSelect({
  label,
  options,
  helperText,
  error,
  onChange,
  id,
  ...props
}: AppSelectProps) {
  const selectId = id ?? `select-${label}`
  const labelId = `${selectId}-label`

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange?.(event.target.value)
  }

  return (
    <FormControl fullWidth error={error} size="medium">
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select labelId={labelId} id={selectId} label={label} onChange={handleChange} {...props}>
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  )
}
