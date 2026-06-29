import { describe, expect, it, vi } from 'vitest'

import { createPocketBaseInterestRepository } from '@/features/items/pocketbase-repository'

function buildPocketBaseRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'interest-1',
    category: 'books',
    title: 'Refactoring',
    status: 'pending',
    notes: 'Revisit the code smells chapter.',
    tags: ['craft', 'legacy'],
    created: '2026-06-29T10:00:00.000Z',
    deletedAt: null,
    coverImageUrl: 'https://images.example.com/refactoring.jpg',
    coverProvider: 'open-library',
    coverMatchedTitle: 'Refactoring',
    ...overrides,
  }
}

describe('createPocketBaseInterestRepository', () => {
  it('lists records sorted by created date and hides soft-deleted items by default', async () => {
    const getFullList = vi.fn().mockResolvedValue([
      buildPocketBaseRecord({ id: 'deleted-interest', deletedAt: '2026-06-29T12:00:00.000Z' }),
      buildPocketBaseRecord({ id: 'active-interest', title: 'Deep Work' }),
    ])

    const repository = createPocketBaseInterestRepository({
      collection: {
        getFullList,
        create: vi.fn(),
        update: vi.fn(),
      },
      userId: 'user-123',
    })

    expect(await repository.listItems()).toEqual([
      {
        id: 'active-interest',
        category: 'books',
        title: 'Deep Work',
        status: 'pending',
        notes: 'Revisit the code smells chapter.',
        tags: ['craft', 'legacy'],
        createdAt: '2026-06-29T10:00:00.000Z',
        coverImageUrl: 'https://images.example.com/refactoring.jpg',
        coverProvider: 'open-library',
        coverMatchedTitle: 'Refactoring',
      },
    ])

    expect(await repository.listItems({ includeDeleted: true })).toHaveLength(2)
    expect(getFullList).toHaveBeenCalledWith({ sort: '-created' })
  })

  it('creates a PocketBase interest record with the authenticated user id', async () => {
    const create = vi.fn().mockResolvedValue(buildPocketBaseRecord({ id: 'interest-2', category: 'movies', title: 'Arrival', coverProvider: 'tmdb' }))

    const repository = createPocketBaseInterestRepository({
      collection: {
        getFullList: vi.fn(),
        create,
        update: vi.fn(),
      },
      userId: 'user-789',
    })

    const createdItem = await repository.createItem({
      category: 'movies',
      title: 'Arrival',
      notes: 'Focused evening watch.',
      tags: [' drama ', 'language'],
      coverImageUrl: 'https://images.example.com/arrival.jpg',
      coverProvider: 'tmdb',
      coverMatchedTitle: 'Arrival',
    })

    expect(create).toHaveBeenCalledWith({
      user: 'user-789',
      category: 'movies',
      title: 'Arrival',
      status: 'pending',
      notes: 'Focused evening watch.',
      tags: ['drama', 'language'],
      coverImageUrl: 'https://images.example.com/arrival.jpg',
      coverProvider: 'tmdb',
      coverMatchedTitle: 'Arrival',
    })
    expect(createdItem.id).toBe('interest-2')
    expect(createdItem.createdAt).toBe('2026-06-29T10:00:00.000Z')
  })

  it('updates item fields and clears optional metadata with null payloads', async () => {
    const update = vi.fn().mockResolvedValue(buildPocketBaseRecord({
      title: 'Clean Architecture',
      notes: null,
      tags: ['architecture'],
      coverImageUrl: null,
      coverProvider: null,
      coverMatchedTitle: null,
    }))

    const repository = createPocketBaseInterestRepository({
      collection: {
        getFullList: vi.fn(),
        create: vi.fn(),
        update,
      },
      userId: 'user-456',
    })

    const updatedItem = await repository.updateItem('interest-1', {
      title: 'Clean Architecture',
      notes: undefined,
      tags: [' architecture '],
      coverImageUrl: undefined,
      coverProvider: undefined,
      coverMatchedTitle: undefined,
    })

    expect(update).toHaveBeenCalledWith('interest-1', {
      title: 'Clean Architecture',
      notes: null,
      tags: ['architecture'],
      coverImageUrl: null,
      coverProvider: null,
      coverMatchedTitle: null,
    })
    expect(updatedItem).toMatchObject({
      title: 'Clean Architecture',
      tags: ['architecture'],
    })
    expect(updatedItem).not.toHaveProperty('notes')
    expect(updatedItem).not.toHaveProperty('coverImageUrl')
    expect(updatedItem).not.toHaveProperty('coverProvider')
    expect(updatedItem).not.toHaveProperty('coverMatchedTitle')
  })

  it('uses update payloads for status, soft delete, and restore operations', async () => {
    const update = vi
      .fn()
      .mockResolvedValueOnce(buildPocketBaseRecord({ status: 'completed' }))
      .mockResolvedValueOnce(buildPocketBaseRecord({ deletedAt: '2026-06-29T12:30:00.000Z' }))
      .mockResolvedValueOnce(buildPocketBaseRecord({ deletedAt: null }))

    const repository = createPocketBaseInterestRepository({
      collection: {
        getFullList: vi.fn(),
        create: vi.fn(),
        update,
      },
      userId: 'user-456',
    })

    const completedItem = await repository.updateStatus('interest-1', 'completed')
    const deletedItem = await repository.deleteItem('interest-1')
    const restoredItem = await repository.restoreItem('interest-1')

    expect(update.mock.calls[0]).toEqual(['interest-1', { status: 'completed' }])
    expect(update.mock.calls[1][0]).toBe('interest-1')
    expect(update.mock.calls[1][1]).toHaveProperty('deletedAt')
    expect(update.mock.calls[2]).toEqual(['interest-1', { deletedAt: null }])
    expect(completedItem?.status).toBe('completed')
    expect(deletedItem?.deletedAt).toBe('2026-06-29T12:30:00.000Z')
    expect(restoredItem?.deletedAt).toBeUndefined()
  })
})
