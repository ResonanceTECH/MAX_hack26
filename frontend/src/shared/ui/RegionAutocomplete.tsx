import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { REGIONS, filterRegions } from '@/shared/constants/labels'

export interface RegionAutocompleteProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: boolean
  helperText?: string | null
  /** Filters: allow clearing to «all». */
  allowEmpty?: boolean
  emptyLabel?: string
  disabled?: boolean
  /** Allow typing a region not in the list (default true). */
  freeSolo?: boolean
  id?: string
}

const muiFilter = createFilterOptions<string>()

export function RegionAutocomplete({
  label = 'Регион',
  value,
  onChange,
  error,
  helperText,
  allowEmpty = false,
  emptyLabel = 'Все',
  disabled,
  freeSolo = true,
  id,
}: RegionAutocompleteProps) {
  const options = allowEmpty ? ['', ...REGIONS] : [...REGIONS]
  const defaultHelper =
    freeSolo
      ? 'Начните вводить — подсказки из списка, можно указать свой регион'
      : undefined

  return (
    <Autocomplete
      id={id}
      freeSolo={freeSolo}
      autoHighlight
      selectOnFocus
      clearOnBlur={false}
      handleHomeEndKeys
      disabled={disabled}
      options={options}
      value={value}
      inputValue={value}
      filterOptions={(opts, state) => {
        const q = state.inputValue
        if (!q.trim()) {
          return allowEmpty ? opts : muiFilter(opts, state)
        }
        const matched = filterRegions(q, opts.filter((o) => o !== '') as string[])
        return allowEmpty ? ['', ...matched] : matched
      }}
      getOptionLabel={(option) => (option === '' ? emptyLabel : option)}
      isOptionEqualToValue={(a, b) => a === b}
      onChange={(_, next) => {
        if (next == null) {
          onChange(allowEmpty ? '' : '')
          return
        }
        onChange(typeof next === 'string' ? next.trim() : String(next))
      }}
      onInputChange={(_, inputValue, reason) => {
        if (reason === 'reset') return
        if (freeSolo || reason === 'clear') {
          onChange(inputValue)
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText === null ? undefined : (helperText ?? defaultHelper)}
          fullWidth
        />
      )}
    />
  )
}
