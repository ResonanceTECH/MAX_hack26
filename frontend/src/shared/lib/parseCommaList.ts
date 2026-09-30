/** Split a user-typed comma-separated string into trimmed non-empty tokens. */
export function parseCommaList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Format string[] for display in a comma-list input (after commit / blur). */
export function formatCommaList(values: string[]): string {
  return values.join(', ')
}
