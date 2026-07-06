import { describe, expect, it } from 'vitest'

import {
  createInMemoryPublicListRepository,
  isPublicListSlugCollisionError,
  type ManagedPublicListCreateInput,
  type PublishPublicListInput,
} from '@/features/items/public-list-repository'
import { appendPublicListItemSnapshot, mapInterestItemToPublicListItem } from '@/features/items/public-list-item-mapper'
import type { PublicList } from '@/features/items/public-list-types'
import type { InterestItem } from '@/features/items/types'

describe('PublicListRepository boundary', () => {
  it('exposes only publish and owner-plus-slug read contracts', () => {
    const repository = createInMemoryPublicListRepository()

    expect(Object.keys(repository).sort()).toEqual([
      'createManagedList',
      'deleteManagedList',
      'getByOwnerAndSlug',
      'getManagedList',
      'listByOwner',
      'listMine',
      'publishList',
      'updateManagedList',
    ])
    expect(repository).not.toHaveProperty('copyList')
    expect(repository).not.toHaveProperty('importList')
    expect(repository).not.toHaveProperty('updateItem')
    expect(repository).not.toHaveProperty('likeList')
    expect(repository).not.toHaveProperty('followOwner')
  })

  it('returns privacy-safe management summaries for the current owner only', async () => {
    const repository = createInMemoryPublicListRepository([
      createPublicListSeed({ id: 'current-list', ownerId: 'user-private', ownerNamespace: 'ana' }),
      createPublicListSeed({ id: 'other-list', ownerId: 'other-user', ownerNamespace: 'sam' }),
    ], { ownerId: 'user-private' })

    await expect(repository.listMine()).resolves.toEqual([
      {
        id: 'current-list',
        ownerNamespace: 'ana',
        slug: 'summer-books',
        title: 'Summer Books',
        listDate: '2026-07-03',
        description: 'Books for the summer break.',
        publishedAt: '2026-07-03T10:00:00.000Z',
        updatedAt: '2026-07-03T10:05:00.000Z',
      },
    ])
  })

  it('deletes managed lists and their embedded items for the authenticated owner', async () => {
    const repository = createInMemoryPublicListRepository([
      createPublicListSeed({ id: 'current-list', ownerId: 'user-private' }),
    ], { ownerId: 'user-private' })

    await expect(repository.deleteManagedList('other-user', 'current-list')).resolves.toEqual({ error: { type: 'unauthenticated' }, ok: false })
    await expect(repository.deleteManagedList('user-private', 'missing-list')).resolves.toEqual({ error: { type: 'owner_mismatch' }, ok: false })
    await expect(repository.deleteManagedList('user-private', 'current-list')).resolves.toEqual({ ok: true })
    await expect(repository.getManagedList('user-private', 'current-list')).resolves.toBeNull()
    await expect(repository.getByOwnerAndSlug('ana', 'summer-books')).resolves.toBeNull()
    await expect(repository.listMine()).resolves.toEqual([])
  })

  it('excludes unpublished lists from owner management summaries', async () => {
    const repository = createInMemoryPublicListRepository([
      createPublicListSeed({ id: 'published-list', ownerId: 'user-private', published: true }),
      createPublicListSeed({ id: 'draft-list', ownerId: 'user-private', published: false }),
    ], { ownerId: 'user-private' })

    await expect(repository.listMine()).resolves.toEqual([
      expect.objectContaining({ id: 'published-list' }),
    ])
  })

  it('returns a public owner profile with published list summaries only', async () => {
    const repository = createInMemoryPublicListRepository([
      createPublicListSeed({ id: 'new-list', ownerNamespace: 'ana', publishedAt: '2026-07-04T10:00:00.000Z', slug: 'new-list', title: 'New List' }),
      createPublicListSeed({ id: 'old-list', ownerNamespace: 'ana', publishedAt: '2026-07-03T10:00:00.000Z', slug: 'old-list', title: 'Old List' }),
      createPublicListSeed({ id: 'draft-list', ownerNamespace: 'ana', published: false, slug: 'draft-list' }),
      createPublicListSeed({ id: 'other-owner-list', ownerNamespace: 'sam', slug: 'sam-list' }),
    ])

    await expect(repository.listByOwner(' Ana ')).resolves.toEqual({
      lists: [
        expect.objectContaining({ id: 'new-list', owner: expect.objectContaining({ displayName: 'ana' }), slug: 'new-list' }),
        expect.objectContaining({ id: 'old-list', owner: expect.objectContaining({ displayName: 'ana' }), slug: 'old-list' }),
      ],
      owner: expect.objectContaining({ displayName: 'ana' }),
      ownerNamespace: 'ana',
    })
  })

  it('returns null when a public owner profile has no published lists', async () => {
    const repository = createInMemoryPublicListRepository([
      createPublicListSeed({ ownerNamespace: 'ana', published: false }),
    ])

    await expect(repository.listByOwner('ana')).resolves.toBeNull()
  })

  it('returns null when public owner-plus-slug lookup matches an unpublished list', async () => {
    const repository = createInMemoryPublicListRepository([
      createPublicListSeed({ id: 'draft-list', ownerId: 'user-private', published: false }),
    ])

    await expect(repository.getByOwnerAndSlug('ana', 'summer-books')).resolves.toBeNull()
  })

  it('does not grant management access through a matching owner namespace', async () => {
    const repository = createInMemoryPublicListRepository([
      createPublicListSeed({ id: 'namespace-collision', ownerId: 'other-user', ownerNamespace: 'ana' }),
    ], { ownerId: 'user-private' })

    await expect(repository.listMine()).resolves.toEqual([])
  })

  it('strips item payloads and private-looking source fields from management summaries', async () => {
    const sourceList = {
      ...createPublicListSeed({ ownerId: 'user-private' }),
      authId: 'auth-secret-id',
      email: 'ana.private@example.com',
      ownerPrivateNotes: 'private-note',
      providerMetadata: { provider: 'github' },
      sessions: ['session-secret'],
      token: 'token-secret',
    }
    const repository = createInMemoryPublicListRepository([sourceList], { ownerId: 'user-private' })
    const [summary] = await repository.listMine()
    const serializedSummary = JSON.stringify(summary)

    expect(summary).not.toHaveProperty('owner')
    expect(summary).not.toHaveProperty('items')
    expect(serializedSummary).not.toContain('auth-secret-id')
    expect(serializedSummary).not.toContain('ana.private@example.com')
    expect(serializedSummary).not.toContain('private-note')
    expect(serializedSummary).not.toContain('session-secret')
    expect(serializedSummary).not.toContain('token-secret')
    expect(serializedSummary).not.toContain('provider')
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

  it('creates and loads managed lists only for the authenticated owner', async () => {
    const repository = createInMemoryPublicListRepository([], { ownerId: 'user-private' })

    const created = await repository.createManagedList(createManagedInput({ slug: 'My Draft List' }))

    expect(created).toMatchObject({
      list: {
        items: [],
        ownerNamespace: 'ana',
        slug: 'my-draft-list',
      },
      ok: true,
    })
    await expect(repository.getManagedList('user-private', 'ana-my-draft-list')).resolves.toMatchObject({ slug: 'my-draft-list' })
    await expect(repository.getManagedList('other-user', 'ana-my-draft-list')).resolves.toBeNull()
  })

  it('updates managed lists without mutating on owner mismatch or slug collision', async () => {
    const repository = createInMemoryPublicListRepository([
      createPublicListSeed({ id: 'current-list', ownerId: 'user-private', slug: 'current-list' }),
      createPublicListSeed({ id: 'existing-list', ownerId: 'user-private', slug: 'existing-list' }),
      createPublicListSeed({ id: 'other-list', ownerId: 'other-user', slug: 'other-list' }),
    ], { ownerId: 'user-private' })

    await expect(repository.updateManagedList({
      authenticatedOwnerId: 'other-user',
      id: 'current-list',
      title: 'Blocked',
    })).resolves.toEqual({ error: { type: 'unauthenticated' }, ok: false })
    await expect(repository.updateManagedList({
      authenticatedOwnerId: 'user-private',
      id: 'other-list',
      title: 'Blocked',
    })).resolves.toEqual({ error: { type: 'owner_mismatch' }, ok: false })
    await expect(repository.updateManagedList({
      authenticatedOwnerId: 'user-private',
      id: 'current-list',
      slug: 'existing-list',
    })).resolves.toEqual({
      error: { ownerNamespace: 'ana', slug: 'existing-list', type: 'slug_collision' },
      ok: false,
    })
    await expect(repository.getManagedList('user-private', 'current-list')).resolves.toMatchObject({
      slug: 'current-list',
      title: 'Summer Books',
    })
  })

  it('preserves committed items when a managed update fails validation', async () => {
    const repository = createInMemoryPublicListRepository([
      createPublicListSeed({ id: 'current-list', ownerId: 'user-private' }),
    ], { ownerId: 'user-private' })

    await expect(repository.updateManagedList({
      authenticatedOwnerId: 'user-private',
      id: 'current-list',
      items: [],
      slug: '!!!',
    })).resolves.toEqual({ error: { field: 'slug', type: 'invalid_route_part' }, ok: false })
    await expect(repository.getManagedList('user-private', 'current-list')).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 'item-1' })],
    })
  })

  it('maps eligible interest items to append-only public snapshots without duplicates', () => {
    const item = createInterestItem()
    const snapshot = mapInterestItemToPublicListItem(item)
    const existingItems = [snapshot]

    item.title = 'Private mutation after snapshot'
    item.tags.push('private-mutation')

    expect(snapshot).toEqual({
      id: 'item-2',
      category: 'books',
      title: 'Domain-Driven Design',
      notes: 'Public note candidate.',
      tags: ['architecture'],
      coverImageUrl: 'https://images.example.com/ddd.jpg',
      coverProvider: 'open-library',
      coverMatchedTitle: 'Domain-Driven Design',
    })
    expect(appendPublicListItemSnapshot(existingItems, item)).toEqual(existingItems)
    expect(appendPublicListItemSnapshot([], item)).toEqual([{ ...snapshot, title: 'Private mutation after snapshot', tags: ['architecture', 'private-mutation'] }])
  })
})

function createManagedInput(overrides: Partial<ManagedPublicListCreateInput> = {}): ManagedPublicListCreateInput {
  const input = createPublishInput()

  return {
    authenticatedOwnerId: input.authenticatedOwnerId,
    owner: input.owner,
    ownerNamespace: input.ownerNamespace,
    slug: input.slug,
    title: input.title,
    listDate: input.listDate,
    description: input.description,
    publishedAt: input.publishedAt,
    ...overrides,
  }
}

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

function createPublicListSeed(overrides: Partial<PublicList & { ownerId: string, published: boolean }> = {}): PublicList & { ownerId?: string, published?: boolean } {
  return {
    id: 'public-list-1',
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
    updatedAt: '2026-07-03T10:05:00.000Z',
    published: true,
    ...overrides,
  }
}

function createInterestItem(): InterestItem {
  return {
    id: 'item-2',
    category: 'books',
    title: 'Domain-Driven Design',
    status: 'pending',
    notes: 'Public note candidate.',
    tags: ['architecture'],
    coverImageUrl: 'https://images.example.com/ddd.jpg',
    coverProvider: 'open-library',
    coverMatchedTitle: 'Domain-Driven Design',
    createdAt: '2026-07-03T09:00:00.000Z',
  }
}
