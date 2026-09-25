const PREFIX = 'b2b_match_mock_v1_'

export function loadMockState<T>(key: string, seed: T): T {
  if (typeof localStorage === 'undefined') return structuredClone(seed)
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return structuredClone(seed)
    return JSON.parse(raw) as T
  } catch {
    return structuredClone(seed)
  }
}

export function saveMockState<T>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* quota / private mode */
  }
}
