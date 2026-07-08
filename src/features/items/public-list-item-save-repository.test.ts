import { describe, expect, it, vi } from 'vitest'

import {
  countPublicListItemSaves,
  createPocketBasePublicListItemSaveRepository,
  recordPublicListItemSaveBestEffort,
} from '@/features/items/public-list-item-save-repository'

describe('public list item save repository', () => {
  it('counts saved public-list items by item id', () => {
    expect(countPublicListItemSaves([
      { itemId: 'item-1' },
      { itemId: 'item-1' },
      { itemId: 'item-2' },
      { itemId: '' },
    ])).toEqual({
      'item-1': 2,
      'item-2': 1,
    })
  })

  it('records item save events with the authenticated user', async () => {
    const create = vi.fn()
    const repository = createPocketBasePublicListItemSaveRepository({
      collection: {
        create,
        getFullList: vi.fn(),
      },
      savedByUserId: 'user-reader',
    })

    await repository.recordItemSave({ itemId: 'item-1', publicListId: 'list-1' })

    expect(create).toHaveBeenCalledWith({
      itemId: 'item-1',
      publicList: 'list-1',
      savedBy: 'user-reader',
    })
  })

  it('does not fail the primary save flow when analytics recording fails', async () => {
    const repository = {
      getItemSaveCounts: vi.fn(),
      recordItemSave: vi.fn(async () => {
        throw new Error('Failed to create record.')
      }),
    }

    await expect(recordPublicListItemSaveBestEffort(repository, { itemId: 'item-1', publicListId: 'list-1' })).resolves.toBe(false)
    expect(repository.recordItemSave).toHaveBeenCalledWith({ itemId: 'item-1', publicListId: 'list-1' })
  })

  it('loads save counts through a public-list scoped filter', async () => {
    const getFullList = vi.fn().mockResolvedValue([{ itemId: 'item-1' }, { itemId: 'item-1' }])
    const repository = createPocketBasePublicListItemSaveRepository({
      collection: {
        create: vi.fn(),
        getFullList,
      },
      savedByUserId: 'user-reader',
    })

    await expect(repository.getItemSaveCounts('list-1')).resolves.toEqual({ 'item-1': 2 })
    expect(getFullList).toHaveBeenCalledWith({
      filter: 'publicList = "list-1"',
      sort: '-created',
    })
  })
})
