export interface FavoriteItem {
  id: string
  type: 'company' | 'opportunity'
  targetId: string
  createdAt: string
}

export let mockFavorites: FavoriteItem[] = [
  {
    id: 'fav-1',
    type: 'opportunity',
    targetId: 'opp-crm-clinics',
    createdAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'fav-2',
    type: 'company',
    targetId: 'company-techflow',
    createdAt: '2026-09-19T12:00:00.000Z',
  },
  {
    id: 'fav-3',
    type: 'opportunity',
    targetId: 'opp-bi-dashboard',
    createdAt: '2026-09-18T09:00:00.000Z',
  },
]

export function isFavorite(type: FavoriteItem['type'], targetId: string): boolean {
  return mockFavorites.some((f) => f.type === type && f.targetId === targetId)
}

export function toggleFavorite(type: FavoriteItem['type'], targetId: string): boolean {
  const existing = mockFavorites.find((f) => f.type === type && f.targetId === targetId)
  if (existing) {
    mockFavorites = mockFavorites.filter((f) => f.id !== existing.id)
    return false
  }
  mockFavorites = [
    {
      id: `fav-${Date.now()}`,
      type,
      targetId,
      createdAt: new Date().toISOString(),
    },
    ...mockFavorites,
  ]
  return true
}
