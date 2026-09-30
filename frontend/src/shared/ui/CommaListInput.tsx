import { useEffect, useState } from 'react'
import { AppInput, type AppInputProps } from '@/shared/ui/AppInput'
import { formatCommaList, parseCommaList } from '@/shared/lib/parseCommaList'

export interface CommaListInputProps extends Omit<AppInputProps, 'value' | 'onChange'> {
  value: string[]
  onChange: (next: string[]) => void
}

/**
 * Controlled comma-list editor: keeps a raw draft string while typing so trailing
 * commas/spaces are not eaten by join/split round-trips. Commits to string[] on blur.
 */
export function CommaListInput({
  value,
  onChange,
  onBlur,
  onFocus,
  ...rest
}: CommaListInputProps) {
  const [draft, setDraft] = useState(() => formatCommaList(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setDraft(formatCommaList(value))
  }, [value, focused])

  const commit = () => {
    const parsed = parseCommaList(draft)
    onChange(parsed)
    setDraft(formatCommaList(parsed))
  }

  return (
    <AppInput
      {...rest}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => {
        setFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocused(false)
        commit()
        onBlur?.(e)
      }}
    />
  )
}
