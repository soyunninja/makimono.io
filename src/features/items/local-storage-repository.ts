import type { InterestItem, InterestRepository, ItemStatus } from '@/features/items/types'

import { defaultMockItems } from '@/features/items/mock-repository'
import {
  buildInterestItem,
  cloneInterestItem,
  cloneInterestItems,
  isInterestItem,
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

function readStoredInterestItems(storage: Storage): { items: InterestItem[] | null; storageAccessible: boolean } {
  let rawValue: string | null
  try {
    rawValue = storage.getItem(INTEREST_ITEMS_STORAGE_KEY)
  } catch {
    return { items: null, storageAccessible: false }
  }

  if (rawValue === null) {
    return { items: null, storageAccessible: true }
  }
  let parsedValue: unknown
  try {
    parsedValue = JSON.parse(rawValue) as unknown
  } catch {
    return { items: null, storageAccessible: true }
  }

  if (!isStoredInterestItemsV1(parsedValue)) {
    return { items: null, storageAccessible: true }
  }

  return {
    items: cloneInterestItems(parsedValue.items),
    storageAccessible: true,
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
    const { items, storageAccessible } = readStoredInterestItems(storage)
    if (!storageAccessible) {
      storageDisabled = true
      return cloneInterestItems(fallbackItems)
    }
    if (items) {
      fallbackItems = cloneInterestItems(items)
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
    async listItems() {
      return readItems()
    },
    async createItem(input) {
      const item = buildInterestItem(input)
      const nextItems = [item, ...readItems()]

      persistItems(nextItems)

      return cloneInterestItem(item)
    },
    async updateStatus(id: string, status: ItemStatus) {
      let updatedItem: InterestItem | null = null

      const nextItems = readItems().map((item) => {
        if (item.id !== id) {
          return item
        }

        updatedItem = {
          ...item,
          status,
        }

        return updatedItem
      })

      if (!updatedItem) {
        return null
      }

      persistItems(nextItems)

      return cloneInterestItem(updatedItem)
    },
  }
}
