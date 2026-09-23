import TextField, { type TextFieldProps } from '@mui/material/TextField'

export type AppInputProps = TextFieldProps

export function AppInput(props: AppInputProps) {
  return <TextField fullWidth size="medium" variant="outlined" {...props} />
}
