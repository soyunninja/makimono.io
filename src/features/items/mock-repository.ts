import {
  type InterestItem,
  type InterestRepository,
  type ItemStatus,
} from '@/features/items/types'

import { createLocalStorageInterestRepository } from '@/features/items/local-storage-repository'
import { buildInterestItem, cloneInterestItem, cloneInterestItems } from '@/features/items/repository-helpers'

let appInterestRepository: InterestRepository | null = null

export const defaultMockItems: InterestItem[] = [
  {
    id: 'series-severance',
    category: 'series',
    title: 'Severance',
    status: 'in_progress',
    notes: 'Season 2 is next in the queue.',
    tags: ['sci-fi', 'office'],
    createdAt: '2026-06-01T08:00:00.000Z',
  },
  {
    id: 'movie-arrival',
    category: 'movies',
    title: 'Arrival',
    status: 'pending',
    notes: 'Keep for a focused evening.',
    tags: ['drama', 'language'],
    createdAt: '2026-06-02T08:00:00.000Z',
  },
  {
    id: 'game-celeste',
    category: 'games',
    title: 'Celeste',
    status: 'completed',
    notes: 'B-side cleanup later.',
    tags: ['platformer', 'indie'],
    createdAt: '2026-06-03T08:00:00.000Z',
  },
  {
    id: 'book-atomic-habits',
    category: 'books',
    title: 'Atomic Habits',
    status: 'in_progress',
    notes: 'Two chapters left.',
    tags: ['productivity'],
    createdAt: '2026-06-04T08:00:00.000Z',
  },
  {
    id: 'web-llms-txt',
    category: 'webs',
    title: 'llmstxt.org',
    status: 'pending',
    notes: 'Reference for future content ingestion ideas.',
    tags: ['ai', 'reference'],
    createdAt: '2026-06-05T08:00:00.000Z',
  },
]

function cloneItem(item: InterestItem): InterestItem {
  return cloneInterestItem(item)
}

export function createMockInterestRepository(seedItems: InterestItem[] = defaultMockItems): InterestRepository {
  let items = cloneInterestItems(seedItems)

  return {
    async listItems() {
      return cloneInterestItems(items)
    },
    async createItem(input) {
      const item = buildInterestItem(input)

      items = [item, ...items]

      return cloneItem(item)
    },
    async updateStatus(id: string, status: ItemStatus) {
      let updatedItem: InterestItem | null = null

      items = items.map((item) => {
        if (item.id !== id) {
          return item
        }

        updatedItem = {
          ...item,
          status,
        }

        return updatedItem
      })

      return updatedItem ? cloneItem(updatedItem) : null
    },
  }
}

function createAppInterestRepository(seedItems: InterestItem[]): InterestRepository {
  if (typeof window === 'undefined') {
    return createMockInterestRepository(seedItems)
  }

  return createLocalStorageInterestRepository(seedItems)
}

export function getAppInterestRepository(seedItems: InterestItem[] = defaultMockItems): InterestRepository {
  if (!appInterestRepository) {
    appInterestRepository = createAppInterestRepository(seedItems)
  }

  return appInterestRepository
}

export function resetAppInterestRepository(seedItems: InterestItem[] = defaultMockItems): InterestRepository {
  appInterestRepository = null

  return getAppInterestRepository(seedItems)
}
