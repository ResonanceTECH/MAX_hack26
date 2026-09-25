import { Controller, type Control } from 'react-hook-form'
import Stack from '@mui/material/Stack'
import type { ServiceFormValues } from '@/features/company-management'
import { AppInput, AppTextarea } from '@/shared/ui'

export function ServiceFormFields({ control }: { control: Control<ServiceFormValues> }) {
  return (
    <Stack spacing={2}>
      <Controller
        name="title"
        control={control}
        render={({ field, fieldState }) => (
          <AppInput
            {...field}
            label="Название"
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="category"
        control={control}
        render={({ field, fieldState }) => (
          <AppInput
            {...field}
            label="Категория"
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="shortDescription"
        control={control}
        render={({ field }) => (
          <AppInput {...field} value={field.value ?? ''} label="Краткое описание" />
        )}
      />
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <AppTextarea
            {...field}
            label="Описание"
            minRows={4}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
    </Stack>
  )
}
