import type { InterestItem, InterestRepository, ItemStatus } from '@/features/items/types'

import { defaultMockItems } from '@/features/items/mock-repository'
import {
  buildInterestItem,
  cloneInterestItem,
  cloneInterestItems,
  deleteInterestItem,
  filterInterestItems,
  hasInvalidCoverMetadata,
  isInterestItem,
  isLegacyWebInterestItem,
  restoreInterestItem,
  updateInterestItem,
  updateInterestItems,
} from '@/features/items/repository-helpers'
export const INTEREST_ITEMS_STORAGE_KEY = 'meinteresa:interest-items:v1'
const INTEREST_ITEMS_STORAGE_VERSION = 1 as const

type StoredInterestItemsV1 = {
  version: typeof INTEREST_ITEMS_STORAGE_VERSION
  items: InterestItem[]
}

function isStoredInterestItemsV1(value: unknown): value is StoredInterestItemsV1 {
  const storedValue = value as { version?: unknown; items?: unknown }
  return (
    typeof value === 'object'
    && value !== null
    && storedValue.version === INTEREST_ITEMS_STORAGE_VERSION
    && Array.isArray(storedValue.items)
    && storedValue.items.every((item) => isInterestItem(item))
  )
}

function isStoredInterestItemsV1Shape(value: unknown): value is { version: typeof INTEREST_ITEMS_STORAGE_VERSION; items: unknown[] } {
  const storedValue = value as { version?: unknown; items?: unknown }
  return (
    typeof value === 'object'
    && value !== null
    && storedValue.version === INTEREST_ITEMS_STORAGE_VERSION
    && Array.isArray(storedValue.items)
  )
}

function getBrowserStorage(storageDisabled: boolean): Storage | null {
  if (storageDisabled || typeof window === 'undefined') {
    return null
  }
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readStoredInterestItems(
  storage: Storage,
): { items: InterestItem[] | null; storageAccessible: boolean; shouldRewrite: boolean } {
  let rawValue: string | null
  try {
    rawValue = storage.getItem(INTEREST_ITEMS_STORAGE_KEY)
  } catch {
    return { items: null, storageAccessible: false, shouldRewrite: false }
  }

  if (rawValue === null) {
    return { items: null, storageAccessible: true, shouldRewrite: false }
  }
  let parsedValue: unknown
  try {
    parsedValue = JSON.parse(rawValue) as unknown
  } catch {
    return { items: null, storageAccessible: true, shouldRewrite: false }
  }

  if (!isStoredInterestItemsV1(parsedValue)) {
    if (!isStoredInterestItemsV1Shape(parsedValue)) {
      return { items: null, storageAccessible: true, shouldRewrite: false }
    }

    const migratedItems: InterestItem[] = []
    let droppedLegacyWebs = false

    for (const item of parsedValue.items) {
      if (isInterestItem(item)) {
        migratedItems.push(cloneInterestItem(item))
        continue
      }

      if (isLegacyWebInterestItem(item)) {
        droppedLegacyWebs = true
        continue
      }

      return { items: null, storageAccessible: true, shouldRewrite: false }
    }

    return {
      items: migratedItems,
      storageAccessible: true,
      shouldRewrite: droppedLegacyWebs,
    }
  }

  const sanitizedItems = cloneInterestItems(parsedValue.items)

  return {
    items: sanitizedItems,
    storageAccessible: true,
    shouldRewrite: parsedValue.items.some((item) => hasInvalidCoverMetadata(item)),
  }
}

function writeStoredInterestItems(storage: Storage, items: InterestItem[]): boolean {
  try {
    storage.setItem(
      INTEREST_ITEMS_STORAGE_KEY,
      JSON.stringify({ version: INTEREST_ITEMS_STORAGE_VERSION, items: cloneInterestItems(items) } satisfies StoredInterestItemsV1),
    )
    return true
  } catch {
    return false
  }
}

export function createLocalStorageInterestRepository(seedItems: InterestItem[] = defaultMockItems): InterestRepository {
  const seedSnapshot = cloneInterestItems(seedItems)
  let fallbackItems = cloneInterestItems(seedItems)
  let storageDisabled = false
  function readItems(): InterestItem[] {
    const storage = getBrowserStorage(storageDisabled)
    if (!storage) {
      storageDisabled = true
      return cloneInterestItems(fallbackItems)
    }
    const { items, storageAccessible, shouldRewrite } = readStoredInterestItems(storage)
    if (!storageAccessible) {
      storageDisabled = true
      return cloneInterestItems(fallbackItems)
    }
    if (items) {
      fallbackItems = cloneInterestItems(items)
      if (shouldRewrite) {
        writeStoredInterestItems(storage, fallbackItems)
      }
      return items
    }
    fallbackItems = cloneInterestItems(seedSnapshot)
    writeStoredInterestItems(storage, fallbackItems)
    return cloneInterestItems(fallbackItems)
  }
  function persistItems(nextItems: InterestItem[]) {
    fallbackItems = cloneInterestItems(nextItems)
    const storage = getBrowserStorage(storageDisabled)
    if (!storage) {
      storageDisabled = true
      return
    }

    if (!writeStoredInterestItems(storage, fallbackItems)) {
      storageDisabled = true
    }
  }
  return {
    async listItems(options) {
      return cloneInterestItems(filterInterestItems(readItems(), options))
    },
    async createItem(input) {
      const item = buildInterestItem(input)
      const nextItems = [item, ...readItems()]

      persistItems(nextItems)

      return cloneInterestItem(item)
    },
    async updateItem(id, input) {
      const updatedItems = updateInterestItems(readItems(), id, (item) => updateInterestItem(item, input))

      if (!updatedItems.updatedItem) {
        return null
      }

      persistItems(updatedItems.nextItems)

      return updatedItems.updatedItem
    },
    async updateStatus(id: string, status: ItemStatus) {
      const updatedItems = updateInterestItems(readItems(), id, (item) => ({
        ...item,
        status,
      }))

      if (!updatedItems.updatedItem) {
        return null
      }

      persistItems(updatedItems.nextItems)

      return updatedItems.updatedItem
    },
    async deleteItem(id) {
      const updatedItems = updateInterestItems(readItems(), id, (item) => deleteInterestItem(item))

      if (!updatedItems.updatedItem) {
        return null
      }

      persistItems(updatedItems.nextItems)

      return updatedItems.updatedItem
    },
    async restoreItem(id) {
      const updatedItems = updateInterestItems(readItems(), id, (item) => restoreInterestItem(item))

      if (!updatedItems.updatedItem) {
        return null
      }

      persistItems(updatedItems.nextItems)

      return updatedItems.updatedItem
    },
  }
}
