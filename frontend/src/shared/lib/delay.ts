import { MOCK_DELAY_MS } from '@/shared/config/app'

export function delay(ms = MOCK_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
