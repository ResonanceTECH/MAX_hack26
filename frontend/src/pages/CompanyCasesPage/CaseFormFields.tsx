import { Controller, type Control } from 'react-hook-form'
import Stack from '@mui/material/Stack'
import type { CaseFormValues } from '@/features/company-management'
import { AppInput, AppTextarea, CommaListInput } from '@/shared/ui'

export function CaseFormFields({ control }: { control: Control<CaseFormValues> }) {
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
        name="industry"
        control={control}
        render={({ field, fieldState }) => (
          <AppInput
            {...field}
            label="Отрасль"
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <AppTextarea
            {...field}
            label="Описание"
            minRows={3}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="result"
        control={control}
        render={({ field, fieldState }) => (
          <AppInput
            {...field}
            label="Результат"
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="technologies"
        control={control}
        render={({ field, fieldState }) => (
          <CommaListInput
            label="Технологии (через запятую)"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="clientName"
        control={control}
        render={({ field }) => (
          <AppInput {...field} value={field.value ?? ''} label="Клиент (необязательно)" />
        )}
      />
    </Stack>
  )
}
