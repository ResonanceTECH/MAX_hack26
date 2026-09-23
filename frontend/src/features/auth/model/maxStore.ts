import { create } from 'zustand'
import { getMaxBridge } from '@/shared/lib/max'

interface MaxIntegrationState {
  isAvailable: boolean
  platform: string | null
  refresh: () => void
}

export const useMaxStore = create<MaxIntegrationState>((set) => ({
  isAvailable: false,
  platform: null,
  refresh: () => {
    const bridge = getMaxBridge()
    set({
      isAvailable: bridge.isAvailable(),
      platform: bridge.getPlatform(),
    })
  },
}))
