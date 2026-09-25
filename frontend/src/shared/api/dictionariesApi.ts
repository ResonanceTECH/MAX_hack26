import { delay } from '@/shared/lib/delay'
import {
  getDictionaryItemById,
  mockDictionaries,
  type DictionaryItem,
  type DictionaryType,
} from '@/shared/mocks/dictionaries'

export const dictionariesApi = {
  async list(type?: DictionaryType): Promise<DictionaryItem[]> {
    await delay()
    const items = type ? mockDictionaries.filter((d) => d.type === type) : [...mockDictionaries]
    return items.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  },

  async create(input: {
    type: DictionaryType
    name: string
    parentId?: string | null
  }): Promise<DictionaryItem> {
    await delay()
    const item: DictionaryItem = {
      id: `dict-${Date.now()}`,
      type: input.type,
      name: input.name.trim(),
      status: 'active',
      parentId: input.parentId ?? null,
      usageCount: 0,
    }
    mockDictionaries.push(item)
    return { ...item }
  },

  async edit(id: string, name: string): Promise<DictionaryItem> {
    await delay()
    const item = getDictionaryItemById(id)
    if (!item) throw new Error('Элемент справочника не найден')
    item.name = name.trim()
    return { ...item }
  },

  async archive(id: string): Promise<DictionaryItem> {
    await delay()
    const item = getDictionaryItemById(id)
    if (!item) throw new Error('Элемент справочника не найден')
    item.status = 'archived'
    return { ...item }
  },
}
