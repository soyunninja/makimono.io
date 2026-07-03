import { describe, expect, it } from 'vitest'

import {
  createInMemoryPublicListRepository,
  isPublicListSlugCollisionError,
  type PublishPublicListInput,
} from '@/features/items/public-list-repository'

describe('PublicListRepository boundary', () => {
  it('exposes only publish and owner-plus-slug read contracts', () => {
    const repository = createInMemoryPublicListRepository()

    expect(Object.keys(repository).sort()).toEqual(['getByOwnerAndSlug', 'publishList'])
    expect(repository).not.toHaveProperty('copyList')
    expect(repository).not.toHaveProperty('importList')
    expect(repository).not.toHaveProperty('updateItem')
    expect(repository).not.toHaveProperty('likeList')
    expect(repository).not.toHaveProperty('followOwner')
  })

  it('returns a deterministic same-owner slug collision error without overwriting the list', async () => {
    const repository = createInMemoryPublicListRepository()
    const input = createPublishInput({ ownerNamespace: 'Ana', slug: 'Summer Books' })

    await expect(repository.publishList(input)).resolves.toMatchObject({ ok: true })
    const collision = await repository.publishList(input)

    expect(collision).toEqual({
      error: { ownerNamespace: 'ana', slug: 'summer-books', type: 'slug_collision' },
      ok: false,
    })
    expect(collision.ok).toBe(false)
    if (!collision.ok) {
      expect(isPublicListSlugCollisionError(collision.error)).toBe(true)
    }
  })

  it('rejects unauthenticated publishing without creating a public list', async () => {
    const repository = createInMemoryPublicListRepository()

    await expect(repository.publishList(createPublishInput({ authenticatedOwnerId: '   ' }))).resolves.toEqual({
      error: { type: 'unauthenticated' },
      ok: false,
    })
    await expect(repository.getByOwnerAndSlug('ana', 'summer-books')).resolves.toBeNull()
  })

  it('creates a public projection clone without retaining private source mutations', async () => {
    const repository = createInMemoryPublicListRepository()
    const input = createPublishInput()
    const result = await repository.publishList(input)

    input.items[0].title = 'Mutated private title'
    input.items[0].tags.push('private-mutation')

    expect(result).toMatchObject({ ok: true })
    await expect(repository.getByOwnerAndSlug('ana', 'summer-books')).resolves.toMatchObject({
      items: [
        {
          tags: ['craft'],
          title: 'Refactoring',
        },
      ],
    })
  })

  it('allows the same slug across different owner namespaces', async () => {
    const repository = createInMemoryPublicListRepository()

    const anaResult = await repository.publishList(createPublishInput({ ownerNamespace: 'ana', slug: 'summer-books' }))
    const samResult = await repository.publishList(createPublishInput({ ownerNamespace: 'sam', slug: 'summer-books' }))

    expect(anaResult.ok).toBe(true)
    expect(samResult.ok).toBe(true)
    expect(await repository.getByOwnerAndSlug('ana', 'summer-books')).toMatchObject({ ownerNamespace: 'ana' })
    expect(await repository.getByOwnerAndSlug('sam', 'summer-books')).toMatchObject({ ownerNamespace: 'sam' })
  })

  it('rejects empty normalized owner namespaces and slugs', async () => {
    const repository = createInMemoryPublicListRepository()

    await expect(repository.publishList(createPublishInput({ ownerNamespace: '!!!', slug: 'summer-books' }))).resolves.toEqual({
      error: { field: 'ownerNamespace', type: 'invalid_route_part' },
      ok: false,
    })
    await expect(repository.publishList(createPublishInput({ ownerNamespace: 'ana', slug: '!!!' }))).resolves.toEqual({
      error: { field: 'slug', type: 'invalid_route_part' },
      ok: false,
    })
  })
})

function createPublishInput(overrides: Partial<Pick<PublishPublicListInput, 'authenticatedOwnerId' | 'ownerNamespace' | 'slug'>> = {}): PublishPublicListInput {
  return {
    authenticatedOwnerId: 'user-private',
    owner: {
      avatarUrl: null,
      displayName: 'ana',
      initial: 'A',
    },
    ownerNamespace: 'ana',
    slug: 'summer-books',
    title: 'Summer Books',
    listDate: '2026-07-03',
    description: 'Books for the summer break.',
    items: [
      {
        id: 'item-1',
        category: 'books',
        title: 'Refactoring',
        tags: ['craft'],
      },
    ],
    publishedAt: '2026-07-03T10:00:00.000Z',
    ...overrides,
  }
}
