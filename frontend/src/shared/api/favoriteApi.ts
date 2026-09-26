import { delay } from '@/shared/lib/delay'
import { apiClient } from '@/shared/api/apiClient'
import { isReal } from '@/shared/api/apiCapabilities'
import { toApiError } from '@/shared/api/errors'
import {
  isFavorite,
  mockFavorites,
  toggleFavorite,
  type FavoriteItem,
} from '@/shared/mocks'

interface FavoriteDto {
  id: number
  type: string
  target_id: number
  created_at: string
}

function mapFav(dto: FavoriteDto): FavoriteItem {
  return {
    id: String(dto.id),
    type: dto.type as FavoriteItem['type'],
    targetId: String(dto.target_id),
    createdAt: dto.created_at,
  }
}

export const favoriteApi = {
  async getAll(): Promise<FavoriteItem[]> {
    if (isReal('favorites')) {
      try {
        const { data } = await apiClient.get<FavoriteDto[]>('/favorites')
        return data.map(mapFav)
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay()
    return [...mockFavorites]
  },

  async isFavorite(type: FavoriteItem['type'], targetId: string): Promise<boolean> {
    if (isReal('favorites')) {
      try {
        const { data } = await apiClient.get<{ favorited: boolean }>('/favorites/check', {
          params: { type, target_id: Number(targetId) },
        })
        return data.favorited
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay(80)
    return isFavorite(type, targetId)
  },

  async toggle(type: FavoriteItem['type'], targetId: string): Promise<boolean> {
    if (isReal('favorites')) {
      try {
        const { data } = await apiClient.post<{ favorited: boolean }>('/favorites/toggle', {
          type,
          target_id: Number(targetId),
        })
        return data.favorited
      } catch (error) {
        throw toApiError(error)
      }
    }
    await delay(150)
    return toggleFavorite(type, targetId)
  },
}
