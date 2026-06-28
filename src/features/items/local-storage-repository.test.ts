import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createLocalStorageInterestRepository,
  INTEREST_ITEMS_STORAGE_KEY,
} from '@/features/items/local-storage-repository'
import { defaultMockItems } from '@/features/items/mock-repository'
import { installMockLocalStorage } from '@/test/mock-local-storage'

async function expectSeedFallback(storedValue: string) {
  window.localStorage.setItem(INTEREST_ITEMS_STORAGE_KEY, storedValue)
  const repository = createLocalStorageInterestRepository(defaultMockItems)
  expect(await repository.listItems()).toEqual(defaultMockItems)
  expect(JSON.parse(window.localStorage.getItem(INTEREST_ITEMS_STORAGE_KEY) as string)).toMatchObject({
    version: 1,
    items: defaultMockItems,
  })
}

beforeEach(() => {
  installMockLocalStorage()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createLocalStorageInterestRepository', () => {
  it('initializes from seed items and persists creates and status updates across repository recreation', async () => {
    const repository = createLocalStorageInterestRepository([])
    expect(await repository.listItems()).toEqual([])
    const created = await repository.createItem({
      category: 'books',
      title: 'Domain-Driven Design',
      notes: 'Revisit aggregates.',
      tags: [' patterns ', 'ddd', ''],
    })
    expect(created.tags).toEqual(['patterns', 'ddd'])
    const updated = await repository.updateStatus(created.id, 'completed')
    expect(updated?.status).toBe('completed')
    const recreatedRepository = createLocalStorageInterestRepository([])
    const persistedItems = await recreatedRepository.listItems()
    expect(persistedItems).toHaveLength(1)
    expect(persistedItems[0]).toMatchObject({
      id: created.id,
      status: 'completed',
      title: 'Domain-Driven Design',
      tags: ['patterns', 'ddd'],
    })
  })

  it('returns clone-safe reads so callers cannot mutate stored data', async () => {
    const repository = createLocalStorageInterestRepository([])
    await repository.createItem({
      category: 'movies',
      title: 'Heat',
      tags: ['crime'],
    })
    const firstRead = await repository.listItems()
    firstRead[0]!.title = 'Mutated title'
    firstRead[0]!.tags.push('extra-tag')
    const secondRead = await repository.listItems()
    expect(secondRead[0]).toMatchObject({
      title: 'Heat',
      tags: ['crime'],
    })
  })

  it.each([
    '{broken-json',
    JSON.stringify({
      version: 0,
      items: [{ id: 'legacy-item', category: 'podcasts', title: 'Legacy', status: 'queued', tags: 'bad', createdAt: 123 }],
    }),
  ])('restores seed items for invalid persisted data', async (storedValue) => {
    await expectSeedFallback(storedValue)
  })

  it('falls back to in-memory items when localStorage access is blocked', async () => {
    const getItemSpy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const repository = createLocalStorageInterestRepository([])
    expect(await repository.listItems()).toEqual([])
    const created = await repository.createItem({
      category: 'series',
      title: 'Andor',
      tags: ['star wars'],
    })
    const items = await repository.listItems()
    expect(created.title).toBe('Andor')
    expect(items).toHaveLength(1)
    expect(items[0]?.title).toBe('Andor')
    expect(getItemSpy).toHaveBeenCalled()
    expect(setItemSpy).not.toHaveBeenCalled()
  })
})
