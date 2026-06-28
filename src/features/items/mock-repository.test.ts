import { describe, expect, it } from 'vitest'

import { createMockInterestRepository, defaultMockItems } from '@/features/items/mock-repository'

describe('createMockInterestRepository', () => {
  it('returns cloned seeded items so callers cannot mutate the source data', async () => {
    const repository = createMockInterestRepository()

    const firstRead = await repository.listItems()
    firstRead[0]!.title = 'Changed by the caller'

    const secondRead = await repository.listItems()

    expect(secondRead).toHaveLength(defaultMockItems.length)
    expect(secondRead[0]!.title).toBe(defaultMockItems[0]!.title)
  })

  it('creates and updates items inside the repository instance only', async () => {
    const repository = createMockInterestRepository([])

    const created = await repository.createItem({
      category: 'books',
      title: 'Clean Architecture',
      notes: 'Re-read chapters on boundaries.',
      tags: ['architecture', 'patterns'],
    })

    expect(created.status).toBe('pending')
    expect(created.tags).toEqual(['architecture', 'patterns'])

    const updated = await repository.updateStatus(created.id, 'completed')

    expect(updated?.status).toBe('completed')

    const items = await repository.listItems()

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      id: created.id,
      status: 'completed',
      title: 'Clean Architecture',
    })
  })
})
