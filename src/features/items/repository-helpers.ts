import {
  itemCategories,
  itemStatuses,
  type Category,
  type CreateInterestItemInput,
  type InterestItem,
  type ItemStatus,
} from '@/features/items/types'

const itemCategorySet = new Set<Category>(itemCategories)
const itemStatusSet = new Set<ItemStatus>(itemStatuses)

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((entry) => typeof entry === 'string')

export const cloneInterestItem = (item: InterestItem): InterestItem => ({ ...item, tags: [...item.tags] })
export const cloneInterestItems = (items: InterestItem[]): InterestItem[] => items.map(cloneInterestItem)

function createItemId(title: string, createdAt: string): string {
  const normalizedTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return `${normalizedTitle || 'item'}-${createdAt}`
}

export function normalizeTags(tags?: string[]): string[] {
  return (tags ?? []).map((tag) => tag.trim()).filter(Boolean)
}

export function buildInterestItem(input: CreateInterestItemInput, createdAt = new Date().toISOString()): InterestItem {
  return {
    id: createItemId(input.title, createdAt),
    category: input.category,
    title: input.title,
    status: 'pending',
    notes: input.notes,
    tags: normalizeTags(input.tags),
    createdAt,
  }
}

export function isInterestItem(value: unknown): value is InterestItem {
  return (
    isRecord(value)
    && typeof value.id === 'string'
    && typeof value.category === 'string'
    && itemCategorySet.has(value.category as Category)
    && typeof value.title === 'string'
    && typeof value.status === 'string'
    && itemStatusSet.has(value.status as ItemStatus)
    && (value.notes === undefined || typeof value.notes === 'string')
    && isStringArray(value.tags)
    && typeof value.createdAt === 'string'
  )
}
