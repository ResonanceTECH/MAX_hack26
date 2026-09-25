export type DictionaryType =
  | 'categories'
  | 'subcategories'
  | 'industries'
  | 'skills'
  | 'technologies'
  | 'regions'
  | 'documentTypes'

export type DictionaryStatus = 'active' | 'archived'

export interface DictionaryItem {
  id: string
  type: DictionaryType
  name: string
  parentId?: string | null
  status: DictionaryStatus
  usageCount?: number
}

export function getDictionaryItemById(id: string): DictionaryItem | undefined {
  return mockDictionaries.find((d) => d.id === id)
}

export const mockDictionaries: DictionaryItem[] = [
  { id: 'cat-dev', type: 'categories', name: 'Разработка ПО', status: 'active', usageCount: 42 },
  { id: 'cat-supply', type: 'categories', name: 'Поставки', status: 'active', usageCount: 28 },
  { id: 'cat-logistics', type: 'categories', name: 'Логистика', status: 'active', usageCount: 19 },
  { id: 'sub-crm', type: 'subcategories', name: 'CRM-системы', parentId: 'cat-dev', status: 'active', usageCount: 15 },
  { id: 'sub-portal', type: 'subcategories', name: 'B2B-порталы', parentId: 'cat-dev', status: 'active', usageCount: 11 },
  { id: 'ind-it', type: 'industries', name: 'IT', status: 'active', usageCount: 55 },
  { id: 'ind-healthcare', type: 'industries', name: 'Healthcare', status: 'active', usageCount: 22 },
  { id: 'ind-retail', type: 'industries', name: 'Retail', status: 'active', usageCount: 31 },
  { id: 'ind-manufacturing', type: 'industries', name: 'Manufacturing', status: 'active', usageCount: 18 },
  { id: 'sk-react', type: 'skills', name: 'React', status: 'active', usageCount: 40 },
  { id: 'sk-fastapi', type: 'skills', name: 'FastAPI', status: 'active', usageCount: 17 },
  { id: 'tech-ts', type: 'technologies', name: 'TypeScript', status: 'active', usageCount: 48 },
  { id: 'tech-pg', type: 'technologies', name: 'PostgreSQL', status: 'active', usageCount: 33 },
  { id: 'tech-jquery', type: 'technologies', name: 'jQuery', status: 'archived', usageCount: 2 },
  { id: 'reg-msk', type: 'regions', name: 'Москва', status: 'active', usageCount: 60 },
  { id: 'reg-spb', type: 'regions', name: 'Санкт-Петербург', status: 'active', usageCount: 35 },
  { id: 'reg-nsk', type: 'regions', name: 'Новосибирск', status: 'active', usageCount: 12 },
  { id: 'doc-charter', type: 'documentTypes', name: 'Устав', status: 'active', usageCount: 40 },
  { id: 'doc-license', type: 'documentTypes', name: 'Лицензия', status: 'active', usageCount: 14 },
  { id: 'doc-edo', type: 'documentTypes', name: 'Соглашение ЭДО', status: 'active', usageCount: 9 },
]
