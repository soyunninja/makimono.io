import {
  type CreateInterestItemInput,
  type InterestItem,
  type InterestRepository,
  type ItemStatus,
} from '@/features/items/types'

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
  return {
    ...item,
    tags: [...item.tags],
  }
}

function createItemId(title: string, createdAt: string): string {
  const normalizedTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return `${normalizedTitle || 'item'}-${createdAt}`
}

function normalizeTags(tags?: string[]): string[] {
  return (tags ?? []).map((tag) => tag.trim()).filter(Boolean)
}

export function createMockInterestRepository(seedItems: InterestItem[] = defaultMockItems): InterestRepository {
  let items = seedItems.map(cloneItem)

  return {
    async listItems() {
      return items.map(cloneItem)
    },
    async createItem(input: CreateInterestItemInput) {
      const createdAt = new Date().toISOString()
      const item: InterestItem = {
        id: createItemId(input.title, createdAt),
        category: input.category,
        title: input.title,
        status: 'pending',
        notes: input.notes,
        tags: normalizeTags(input.tags),
        createdAt,
      }

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

export function getAppInterestRepository(seedItems: InterestItem[] = defaultMockItems): InterestRepository {
  if (!appInterestRepository) {
    appInterestRepository = createMockInterestRepository(seedItems)
  }

  return appInterestRepository
}

export function resetAppInterestRepository(seedItems: InterestItem[] = defaultMockItems): InterestRepository {
  appInterestRepository = createMockInterestRepository(seedItems)

  return appInterestRepository
}
