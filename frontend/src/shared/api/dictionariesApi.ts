import { SYSTEM_ROLES } from '@/entities/user'
import { delay } from '@/shared/lib/delay'
import { saveMockState } from '@/shared/lib/mockPersist'
import { AUDIT_ACTIONS, appendAudit } from '@/shared/mocks/audit'
import {
  dictionarySlugify,
  getDictionaryItemById,
  mockDictionaries,
  type DictionaryItem,
  type DictionaryType,
} from '@/shared/mocks/dictionaries'
import type { AdminActor } from './adminUsersApi'

function persist() {
  saveMockState('dictionaries', mockDictionaries)
}

function defaultActor(): AdminActor {
  return {
    id: 'user-platform-admin',
    name: 'Александр Иванов',
    role: SYSTEM_ROLES.PLATFORM_ADMIN,
  }
}

function wouldCreateCycle(id: string, parentId: string | null | undefined): boolean {
  if (!parentId) return false
  if (parentId === id) return true
  let current = getDictionaryItemById(parentId)
  const seen = new Set<string>()
  while (current?.parentId) {
    if (current.parentId === id) return true
    if (seen.has(current.id)) return true
    seen.add(current.id)
    current = getDictionaryItemById(current.parentId)
  }
  return false
}

export interface DictionaryCreateInput {
  type: DictionaryType
  name: string
  slug?: string
  parentId?: string | null
  description?: string
  sortOrder?: number
  status?: 'active' | 'archived'
  aliases?: string[]
  category?: string
}

export interface DictionaryUpdateInput {
  name?: string
  slug?: string
  parentId?: string | null
  description?: string
  sortOrder?: number
  aliases?: string[]
  category?: string
  status?: 'active' | 'archived'
}

export const dictionariesApi = {
  async getAll(type?: DictionaryType): Promise<DictionaryItem[]> {
    return this.list(type)
  },

  async list(type?: DictionaryType): Promise<DictionaryItem[]> {
    await delay(200 + Math.floor(Math.random() * 400))
    const items = type ? mockDictionaries.filter((d) => d.type === type) : [...mockDictionaries]
    return items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ru'))
  },

  async getById(id: string): Promise<DictionaryItem> {
    await delay(200 + Math.floor(Math.random() * 200))
    const item = getDictionaryItemById(id)
    if (!item) throw new Error('Элемент справочника не найден')
    return { ...item }
  },

  async create(input: DictionaryCreateInput, actor: AdminActor = defaultActor()): Promise<DictionaryItem> {
    await delay(300 + Math.floor(Math.random() * 300))
    const slug = (input.slug ?? dictionarySlugify(input.name)).trim()
    if (!slug) throw new Error('Slug обязателен')
    if (mockDictionaries.some((d) => d.slug === slug && d.type === input.type)) {
      throw new Error('Slug должен быть уникальным')
    }
    if (input.parentId === undefined) {
      /* ok */
    } else if (input.parentId && !getDictionaryItemById(input.parentId)) {
      throw new Error('Родительская категория не найдена')
    }
    const now = new Date().toISOString()
    const item: DictionaryItem = {
      id: `dict-${Date.now()}`,
      type: input.type,
      name: input.name.trim(),
      slug,
      parentId: input.parentId ?? null,
      aliases: input.aliases ?? [],
      status: input.status ?? 'active',
      sortOrder: input.sortOrder ?? mockDictionaries.filter((d) => d.type === input.type).length,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      category: input.category,
      description: input.description,
    }
    mockDictionaries.push(item)
    persist()
    appendAudit({
      actorId: actor.id,
      actorName: actor.name,
      role: actor.role,
      action: AUDIT_ACTIONS.DICTIONARY_CREATED,
      entityType: 'dictionary',
      entityId: item.id,
      entityName: item.name,
      after: { name: item.name, slug: item.slug, type: item.type },
      source: 'platform_admin',
    })
    return { ...item }
  },

  async update(
    id: string,
    patch: DictionaryUpdateInput,
    actor: AdminActor = defaultActor(),
  ): Promise<DictionaryItem> {
    await delay(300 + Math.floor(Math.random() * 300))
    const item = getDictionaryItemById(id)
    if (!item) throw new Error('Элемент справочника не найден')
    if (patch.slug && mockDictionaries.some((d) => d.id !== id && d.slug === patch.slug && d.type === item.type)) {
      throw new Error('Slug должен быть уникальным')
    }
    if (patch.parentId !== undefined) {
      if (wouldCreateCycle(id, patch.parentId)) {
        throw new Error('Нельзя создать циклическую зависимость parent')
      }
    }
    const before = { name: item.name, slug: item.slug, parentId: item.parentId, status: item.status }
    if (patch.name !== undefined) item.name = patch.name.trim()
    if (patch.slug !== undefined) item.slug = patch.slug.trim()
    if (patch.parentId !== undefined) item.parentId = patch.parentId
    if (patch.description !== undefined) item.description = patch.description
    if (patch.sortOrder !== undefined) item.sortOrder = patch.sortOrder
    if (patch.aliases !== undefined) item.aliases = patch.aliases
    if (patch.category !== undefined) item.category = patch.category
    if (patch.status !== undefined) item.status = patch.status
    item.updatedAt = new Date().toISOString()
    persist()
    appendAudit({
      actorId: actor.id,
      actorName: actor.name,
      role: actor.role,
      action: AUDIT_ACTIONS.DICTIONARY_UPDATED,
      entityType: 'dictionary',
      entityId: item.id,
      entityName: item.name,
      before,
      after: { name: item.name, slug: item.slug, parentId: item.parentId, status: item.status },
      source: 'platform_admin',
    })
    return { ...item }
  },

  /** @deprecated */
  async edit(id: string, name: string): Promise<DictionaryItem> {
    return this.update(id, { name })
  },

  async archive(id: string, actor: AdminActor = defaultActor()): Promise<DictionaryItem> {
    await delay(300 + Math.floor(Math.random() * 300))
    const item = getDictionaryItemById(id)
    if (!item) throw new Error('Элемент справочника не найден')
    const before = { status: item.status }
    item.status = 'archived'
    item.updatedAt = new Date().toISOString()
    persist()
    appendAudit({
      actorId: actor.id,
      actorName: actor.name,
      role: actor.role,
      action: AUDIT_ACTIONS.DICTIONARY_ARCHIVED,
      entityType: 'dictionary',
      entityId: item.id,
      entityName: item.name,
      before,
      after: { status: 'archived' },
      reason: item.usageCount > 0 ? `Используется в ${item.usageCount} объектах` : undefined,
      source: 'platform_admin',
    })
    return { ...item }
  },

  async restore(id: string, actor: AdminActor = defaultActor()): Promise<DictionaryItem> {
    return this.update(id, { status: 'active' }, actor)
  },
}
