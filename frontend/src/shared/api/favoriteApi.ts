import { delay } from '@/shared/lib/delay'
import {
  isFavorite,
  mockFavorites,
  toggleFavorite,
  type FavoriteItem,
} from '@/shared/mocks'

export const favoriteApi = {
  async getAll(): Promise<FavoriteItem[]> {
    await delay()
    return [...mockFavorites]
  },

  async isFavorite(type: FavoriteItem['type'], targetId: string): Promise<boolean> {
    await delay(80)
    return isFavorite(type, targetId)
  },

  async toggle(type: FavoriteItem['type'], targetId: string): Promise<boolean> {
    await delay(150)
    return toggleFavorite(type, targetId)
  },
}
