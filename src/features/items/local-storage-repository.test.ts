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
  it('persists edit, soft-delete, and restore operations across repository recreation', async () => {
    const repository = createLocalStorageInterestRepository([])
    expect(await repository.listItems()).toEqual([])
    const created = await repository.createItem({
      category: 'books',
      title: 'Domain-Driven Design',
      notes: 'Revisit aggregates.',
      tags: [' patterns ', 'ddd', ''],
    })
    expect(created.tags).toEqual(['patterns', 'ddd'])

    const edited = await repository.updateItem(created.id, {
      title: 'Domain-Driven Design Distilled',
      notes: undefined,
      tags: [' tactical ', 'ddd', ''],
    })
    expect(edited).toMatchObject({
      id: created.id,
      title: 'Domain-Driven Design Distilled',
      tags: ['tactical', 'ddd'],
    })
    expect(edited?.notes).toBeUndefined()

    const updated = await repository.updateStatus(created.id, 'completed')
    expect(updated?.status).toBe('completed')

    const deleted = await repository.deleteItem(created.id)
    expect(deleted?.deletedAt).toEqual(expect.any(String))
    expect(await repository.listItems()).toEqual([])
    expect(await repository.listItems({ includeDeleted: true })).toHaveLength(1)

    const recreatedRepository = createLocalStorageInterestRepository([])
    const persistedDeletedItems = await recreatedRepository.listItems({ includeDeleted: true })
    expect(persistedDeletedItems).toHaveLength(1)
    expect(persistedDeletedItems[0]).toMatchObject({
      id: created.id,
      status: 'completed',
      title: 'Domain-Driven Design Distilled',
      tags: ['tactical', 'ddd'],
    })

    const restored = await recreatedRepository.restoreItem(created.id)
    expect(restored?.deletedAt).toBeUndefined()

    const restoredRepository = createLocalStorageInterestRepository([])
    const persistedActiveItems = await restoredRepository.listItems()
    expect(persistedActiveItems).toHaveLength(1)
    expect(persistedActiveItems[0]).toMatchObject({
      id: created.id,
      status: 'completed',
      title: 'Domain-Driven Design Distilled',
      tags: ['tactical', 'ddd'],
    })
    expect(persistedActiveItems[0]?.deletedAt).toBeUndefined()
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
    JSON.stringify({
      version: 1,
      items: [{
        id: 'legacy-item',
        category: 'books',
        title: 'Legacy',
        status: 'pending',
        tags: [],
        createdAt: '2026-06-01T08:00:00.000Z',
        deletedAt: 123,
      }],
    }),
  ])('restores seed items for invalid persisted data', async (storedValue) => {
    await expectSeedFallback(storedValue)
  })

  it('keeps backward compatibility with version 1 items that omit deletedAt', async () => {
    const legacyItems = [{
      id: 'book-refactoring',
      category: 'books',
      title: 'Refactoring',
      status: 'pending',
      notes: 'Legacy payload.',
      tags: ['code'],
      createdAt: '2026-06-01T08:00:00.000Z',
    }]

    window.localStorage.setItem(INTEREST_ITEMS_STORAGE_KEY, JSON.stringify({
      version: 1,
      items: legacyItems,
    }))

    const repository = createLocalStorageInterestRepository([])

    await expect(repository.listItems()).resolves.toEqual(legacyItems)
  })

  it('accepts persisted podcast items as valid version 1 data', async () => {
    const legacyItems = [{
      id: 'podcast-syntax',
      category: 'podcasts',
      title: 'Syntax',
      status: 'pending',
      notes: 'Keep this queued.',
      tags: ['development'],
      createdAt: '2026-06-01T08:00:00.000Z',
    }]

    window.localStorage.setItem(INTEREST_ITEMS_STORAGE_KEY, JSON.stringify({
      version: 1,
      items: legacyItems,
    }))

    const repository = createLocalStorageInterestRepository([])

    await expect(repository.listItems()).resolves.toEqual(legacyItems)
  })

  it('accepts older items without cover fields and persists new cover metadata', async () => {
    const legacyItems = [{
      id: 'series-andor',
      category: 'series',
      title: 'Andor',
      status: 'pending',
      tags: ['star wars'],
      createdAt: '2026-06-01T08:00:00.000Z',
    }]

    window.localStorage.setItem(INTEREST_ITEMS_STORAGE_KEY, JSON.stringify({
      version: 1,
      items: legacyItems,
    }))

    const repository = createLocalStorageInterestRepository([])

    await expect(repository.listItems()).resolves.toEqual(legacyItems)

    const created = await repository.createItem({
      category: 'movies',
      title: 'Arrival',
      tags: ['sci-fi'],
      coverImageUrl: 'https://images.example.com/arrival.jpg',
      coverMatchedTitle: 'Arrival',
      coverProvider: 'tmdb',
    })

    expect(created).toMatchObject({
      coverImageUrl: 'https://images.example.com/arrival.jpg',
      coverMatchedTitle: 'Arrival',
      coverProvider: 'tmdb',
    })

    const recreatedRepository = createLocalStorageInterestRepository([])
    const recreatedItems = await recreatedRepository.listItems()

    expect(recreatedItems[0]).toMatchObject({
      title: 'Arrival',
      coverImageUrl: 'https://images.example.com/arrival.jpg',
      coverMatchedTitle: 'Arrival',
      coverProvider: 'tmdb',
    })
    expect(recreatedItems[1]).toEqual(legacyItems[0])
  })

  it('drops invalid persisted cover fields while keeping the rest of the item', async () => {
    window.localStorage.setItem(INTEREST_ITEMS_STORAGE_KEY, JSON.stringify({
      version: 1,
      items: [{
        id: 'movie-arrival',
        category: 'movies',
        title: 'Arrival',
        status: 'pending',
        tags: ['sci-fi'],
        createdAt: '2026-06-01T08:00:00.000Z',
        coverImageUrl: 'notaurl',
        coverMatchedTitle: 42,
        coverProvider: 'unknown-provider',
      }],
    }))

    const repository = createLocalStorageInterestRepository([])

    await expect(repository.listItems()).resolves.toEqual([
      {
        id: 'movie-arrival',
        category: 'movies',
        title: 'Arrival',
        status: 'pending',
        tags: ['sci-fi'],
        createdAt: '2026-06-01T08:00:00.000Z',
      },
    ])
    expect(JSON.parse(window.localStorage.getItem(INTEREST_ITEMS_STORAGE_KEY) as string)).toEqual({
      version: 1,
      items: [{
        id: 'movie-arrival',
        category: 'movies',
        title: 'Arrival',
        status: 'pending',
        tags: ['sci-fi'],
        createdAt: '2026-06-01T08:00:00.000Z',
      }],
    })
  })

  it('drops legacy webs items while preserving other version 1 items', async () => {
    const legacyItems = [
      {
        id: 'book-refactoring',
        category: 'books',
        title: 'Refactoring',
        status: 'pending',
        notes: 'Keep this one.',
        tags: ['code'],
        createdAt: '2026-06-01T08:00:00.000Z',
      },
      {
        id: 'web-legacy-guide',
        category: 'webs',
        title: 'Legacy guide',
        status: 'pending',
        notes: 'This category no longer exists.',
        tags: ['reference'],
        createdAt: '2026-06-02T08:00:00.000Z',
      },
    ]

    window.localStorage.setItem(INTEREST_ITEMS_STORAGE_KEY, JSON.stringify({
      version: 1,
      items: legacyItems,
    }))

    const repository = createLocalStorageInterestRepository([])

    await expect(repository.listItems()).resolves.toEqual([legacyItems[0]])
    expect(JSON.parse(window.localStorage.getItem(INTEREST_ITEMS_STORAGE_KEY) as string)).toEqual({
      version: 1,
      items: [legacyItems[0]],
    })
  })

  it('returns null for missing edit, delete, and restore operations without mutating stored items', async () => {
    const repository = createLocalStorageInterestRepository(defaultMockItems)
    const beforeItems = await repository.listItems({ includeDeleted: true })

    await expect(repository.updateItem('missing-item', { title: 'Nope' })).resolves.toBeNull()
    await expect(repository.deleteItem('missing-item')).resolves.toBeNull()
    await expect(repository.restoreItem('missing-item')).resolves.toBeNull()

    await expect(repository.listItems({ includeDeleted: true })).resolves.toEqual(beforeItems)
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
    const edited = await repository.updateItem(created.id, {
      title: 'Andor Season 1',
    })
    const deleted = await repository.deleteItem(created.id)
    const hiddenItems = await repository.listItems()
    const restored = await repository.restoreItem(created.id)
    const items = await repository.listItems()
    expect(created.title).toBe('Andor')
    expect(edited?.title).toBe('Andor Season 1')
    expect(deleted?.deletedAt).toEqual(expect.any(String))
    expect(hiddenItems).toEqual([])
    expect(restored?.deletedAt).toBeUndefined()
    expect(items).toHaveLength(1)
    expect(items[0]?.title).toBe('Andor Season 1')
    expect(getItemSpy).toHaveBeenCalled()
    expect(setItemSpy).not.toHaveBeenCalled()
  })
})
