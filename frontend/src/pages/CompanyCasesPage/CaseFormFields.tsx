import { Controller, type Control } from 'react-hook-form'
import Stack from '@mui/material/Stack'
import type { CaseFormValues } from '@/features/company-management'
import { AppInput, AppTextarea } from '@/shared/ui'

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

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
          <AppInput
            label="Технологии (через запятую)"
            value={field.value.join(', ')}
            onChange={(e) => field.onChange(parseTags(e.target.value))}
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
