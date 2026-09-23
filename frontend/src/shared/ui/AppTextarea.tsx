import TextField, { type TextFieldProps } from '@mui/material/TextField'

export type AppTextareaProps = TextFieldProps

export function AppTextarea(props: AppTextareaProps) {
  return <TextField fullWidth multiline minRows={4} variant="outlined" {...props} />
}
