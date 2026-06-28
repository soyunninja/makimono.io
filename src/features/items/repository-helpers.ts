import {
  itemCategories,
  itemStatuses,
  type Category,
  type CreateInterestItemInput,
  type InterestItem,
  type ItemStatus,
  type ListInterestItemsOptions,
  type UpdateInterestItemInput,
} from '@/features/items/types'

const itemCategorySet = new Set<Category>(itemCategories)
const itemStatusSet = new Set<ItemStatus>(itemStatuses)
const hasOwn = Object.prototype.hasOwnProperty

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

export function filterInterestItems(items: InterestItem[], options?: ListInterestItemsOptions): InterestItem[] {
  if (options?.includeDeleted) {
    return items
  }

  return items.filter((item) => item.deletedAt === undefined)
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

export function updateInterestItem(item: InterestItem, input: UpdateInterestItemInput): InterestItem {
  const nextItem: InterestItem = {
    ...item,
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.tags !== undefined ? { tags: normalizeTags(input.tags) } : {}),
  }

  if (hasOwn.call(input, 'notes')) {
    nextItem.notes = input.notes
  }

  return nextItem
}

export function deleteInterestItem(item: InterestItem, deletedAt = new Date().toISOString()): InterestItem {
  return {
    ...item,
    deletedAt,
  }
}

export function restoreInterestItem(item: InterestItem): InterestItem {
  const { deletedAt: _deletedAt, ...restoredItem } = item

  return restoredItem
}

export function updateInterestItems(
  items: InterestItem[],
  id: string,
  update: (item: InterestItem) => InterestItem,
): { nextItems: InterestItem[]; updatedItem: InterestItem | null } {
  let updatedItem: InterestItem | null = null

  const nextItems = items.map((item) => {
    if (item.id !== id) {
      return item
    }

    updatedItem = update(item)

    return updatedItem
  })

  return {
    nextItems,
    updatedItem: updatedItem ? cloneInterestItem(updatedItem) : null,
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
    && (value.deletedAt === undefined || typeof value.deletedAt === 'string')
  )
}
