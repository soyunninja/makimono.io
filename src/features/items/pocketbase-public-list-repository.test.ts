import { describe, expect, it, vi } from 'vitest'

import {
  buildManagedPublicListUpdatePayload,
  buildPublicListPublishPayload,
  createPocketBasePublicListRepository,
  mapPocketBasePublicListManagementSummary,
  mapPocketBasePublicListRecord,
} from '@/features/items/pocketbase-public-list-repository'
import type { ManagedPublicListCreateInput, PublishPublicListInput } from '@/features/items/public-list-repository'
import { PocketBaseClientResponseError } from '@/lib/pocketbase'

describe('PocketBase public list mapper', () => {
  it('builds publish payloads from display-only fields while keeping the private owner id out of PublicList', () => {
    const payload = buildPublicListPublishPayload(createPublishInput(), 'user-private')
    const publicList = mapPocketBasePublicListRecord(createPocketBasePublicListRecord())

    expect(payload).toMatchObject({
      owner: 'user-private',
      ownerNamespace: 'ana',
      slug: 'summer-books',
      published: true,
    })
    expect(publicList).not.toHaveProperty('ownerId')
    expect(JSON.stringify(publicList)).not.toContain('user-private')
  })

  it('maps public lookup records to privacy-safe projections only', () => {
    const publicList = mapPocketBasePublicListRecord(createPocketBasePublicListRecord({
      authId: 'auth-secret-id',
      email: 'ana.private@example.com',
      metadata: { provider: 'password' },
      owner: 'user-private',
      privateNotes: 'Only the owner should see this.',
      providerMetadata: { provider: 'github' },
      sessions: ['session-secret'],
      token: 'token-secret',
    }))
    const serializedPublicList = JSON.stringify(publicList)

    expect(publicList).toEqual({
      id: 'public-list-1',
      owner: {
        avatarUrl: 'https://cdn.example.com/avatar.webp',
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
          notes: 'Public note.',
          tags: ['craft'],
          coverImageUrl: 'https://images.example.com/refactoring.jpg',
          coverProvider: 'open-library',
          coverMatchedTitle: 'Refactoring',
        },
      ],
      publishedAt: '2026-07-03T10:00:00.000Z',
      updatedAt: '2026-07-03T10:05:00.000Z',
    })
    expect(serializedPublicList).not.toContain('ana.private@example.com')
    expect(serializedPublicList).not.toContain('auth-secret-id')
    expect(serializedPublicList).not.toContain('session-secret')
    expect(serializedPublicList).not.toContain('token-secret')
    expect(serializedPublicList).not.toContain('provider')
    expect(serializedPublicList).not.toContain('Only the owner should see this.')
  })

  it('reads by normalized owner namespace and slug through a public published-record filter', async () => {
    const getFullList = vi.fn().mockResolvedValue([createPocketBasePublicListRecord()])
    const repository = createPocketBasePublicListRepository({
      collection: {
        create: vi.fn(),
        getFullList,
        update: vi.fn(),
      },
      ownerId: 'user-private',
    })

    await expect(repository.getByOwnerAndSlug(' Ana ', ' Summer Books! ')).resolves.toMatchObject({
      ownerNamespace: 'ana',
      slug: 'summer-books',
    })
    expect(getFullList).toHaveBeenCalledWith({
      filter: 'published = true && ownerNamespace = "ana" && slug = "summer-books"',
      perPage: 1,
      sort: '-publishedAt',
    })
  })

  it('lists current-owner published management summaries by stored owner relation only', async () => {
    const getFullList = vi.fn().mockResolvedValue([
      createPocketBasePublicListRecord({ id: 'new-list', publishedAt: '2026-07-04T10:00:00.000Z' }),
      createPocketBasePublicListRecord({ id: 'old-list', publishedAt: '2026-07-03T10:00:00.000Z' }),
    ])
    const repository = createPocketBasePublicListRepository({
      collection: {
        create: vi.fn(),
        getFullList,
        update: vi.fn(),
      },
      ownerId: 'user-private',
    })

    await expect(repository.listMine()).resolves.toEqual([
      expect.objectContaining({ id: 'new-list' }),
      expect.objectContaining({ id: 'old-list' }),
    ])
    expect(getFullList).toHaveBeenCalledWith({
      filter: 'published = true && owner = "user-private"',
      sort: '-publishedAt',
    })
    const [options] = getFullList.mock.calls[0]
    expect(options?.filter).not.toContain('ownerNamespace')
  })

  it('strips private fields and item payloads from management summaries', () => {
    const summary = mapPocketBasePublicListManagementSummary(createPocketBasePublicListRecord({
      authId: 'auth-secret-id',
      email: 'ana.private@example.com',
      metadata: { provider: 'password' },
      owner: 'user-private',
      privateNotes: 'Only the owner should see this.',
      providerMetadata: { provider: 'github' },
      sessions: ['session-secret'],
      token: 'token-secret',
    }))
    const serializedSummary = JSON.stringify(summary)

    expect(summary).toEqual({
      id: 'public-list-1',
      ownerNamespace: 'ana',
      slug: 'summer-books',
      title: 'Summer Books',
      listDate: '2026-07-03',
      description: 'Books for the summer break.',
      publishedAt: '2026-07-03T10:00:00.000Z',
      updatedAt: '2026-07-03T10:05:00.000Z',
    })
    expect(summary).not.toHaveProperty('owner')
    expect(summary).not.toHaveProperty('items')
    expect(serializedSummary).not.toContain('ana.private@example.com')
    expect(serializedSummary).not.toContain('auth-secret-id')
    expect(serializedSummary).not.toContain('session-secret')
    expect(serializedSummary).not.toContain('token-secret')
    expect(serializedSummary).not.toContain('provider')
    expect(serializedSummary).not.toContain('Only the owner should see this.')
  })

  it('publishes authenticated lists through PocketBase create with normalized route data', async () => {
    const create = vi.fn().mockResolvedValue(createPocketBasePublicListRecord())
    const repository = createPocketBasePublicListRepository({
      collection: {
        create,
        getFullList: vi.fn(),
        update: vi.fn(),
      },
      ownerId: 'user-private',
    })

    await expect(repository.publishList(createPublishInput())).resolves.toMatchObject({
      list: {
        ownerNamespace: 'ana',
        slug: 'summer-books',
      },
      ok: true,
    })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      owner: 'user-private',
      ownerNamespace: 'ana',
      slug: 'summer-books',
    }))
  })

  it('creates managed lists through owner-scoped PocketBase payloads with empty initial items', async () => {
    const create = vi.fn().mockResolvedValue(createPocketBasePublicListRecord({ items: [] }))
    const repository = createPocketBasePublicListRepository({
      collection: {
        create,
        getFullList: vi.fn(),
        update: vi.fn(),
      },
      ownerId: 'user-private',
    })

    await expect(repository.createManagedList(createManagedInput())).resolves.toMatchObject({
      list: { id: 'public-list-1', items: [] },
      ok: true,
    })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      items: [],
      owner: 'user-private',
      ownerNamespace: 'ana',
      published: true,
      slug: 'summer-books',
    }))
  })

  it('loads managed lists by owner relation and id only', async () => {
    const getFullList = vi.fn().mockResolvedValue([createPocketBasePublicListRecord()])
    const repository = createPocketBasePublicListRepository({
      collection: {
        create: vi.fn(),
        getFullList,
        update: vi.fn(),
      },
      ownerId: 'user-private',
    })

    await expect(repository.getManagedList('user-private', 'public-list-1')).resolves.toMatchObject({ id: 'public-list-1' })
    expect(getFullList).toHaveBeenCalledWith({
      filter: 'published = true && owner = "user-private" && id = "public-list-1"',
      perPage: 1,
    })
  })

  it('updates managed lists only after an owner-scoped load', async () => {
    const getFullList = vi.fn().mockResolvedValue([createPocketBasePublicListRecord()])
    const update = vi.fn().mockResolvedValue(createPocketBasePublicListRecord({ title: 'Updated Summer Books' }))
    const repository = createPocketBasePublicListRepository({
      collection: {
        create: vi.fn(),
        getFullList,
        update,
      },
      ownerId: 'user-private',
    })

    await expect(repository.updateManagedList({
      authenticatedOwnerId: 'user-private',
      id: 'public-list-1',
      title: 'Updated Summer Books',
    })).resolves.toMatchObject({ list: { title: 'Updated Summer Books' }, ok: true })
    expect(update).toHaveBeenCalledWith('public-list-1', { title: 'Updated Summer Books' })
  })

  it('denies managed updates when the owner-scoped record is missing', async () => {
    const update = vi.fn()
    const repository = createPocketBasePublicListRepository({
      collection: {
        create: vi.fn(),
        getFullList: vi.fn().mockResolvedValue([]),
        update,
      },
      ownerId: 'user-private',
    })

    await expect(repository.updateManagedList({
      authenticatedOwnerId: 'user-private',
      id: 'other-list',
      title: 'Blocked update',
    })).resolves.toEqual({ error: { type: 'owner_mismatch' }, ok: false })
    expect(update).not.toHaveBeenCalled()
  })

  it('returns recoverable slug collision errors for managed creates and updates', async () => {
    const collision = new PocketBaseClientResponseError(400, { data: { ownerNamespace: {}, slug: {} } })
    const repository = createPocketBasePublicListRepository({
      collection: {
        create: vi.fn().mockRejectedValueOnce(collision),
        getFullList: vi.fn().mockResolvedValue([createPocketBasePublicListRecord()]),
        update: vi.fn().mockRejectedValueOnce(collision),
      },
      ownerId: 'user-private',
    })

    await expect(repository.createManagedList(createManagedInput())).resolves.toEqual({
      error: { ownerNamespace: 'ana', slug: 'summer-books', type: 'slug_collision' },
      ok: false,
    })
    await expect(repository.updateManagedList({
      authenticatedOwnerId: 'user-private',
      id: 'public-list-1',
      slug: 'Summer Books',
    })).resolves.toEqual({
      error: { ownerNamespace: 'ana', slug: 'summer-books', type: 'slug_collision' },
      ok: false,
    })
  })

  it('returns recoverable update failures without changing committed loaded items', async () => {
    const getFullList = vi.fn().mockResolvedValue([createPocketBasePublicListRecord()])
    const repository = createPocketBasePublicListRepository({
      collection: {
        create: vi.fn(),
        getFullList,
        update: vi.fn().mockRejectedValue(new PocketBaseClientResponseError(500, { message: 'nope' })),
      },
      ownerId: 'user-private',
    })

    await expect(repository.updateManagedList({
      authenticatedOwnerId: 'user-private',
      id: 'public-list-1',
      items: [],
    })).resolves.toEqual({ error: { type: 'operation_failed' }, ok: false })
    await expect(repository.getManagedList('user-private', 'public-list-1')).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 'item-1' })],
    })
  })

  it('builds update payloads from safe mutable fields only', () => {
    const payload = buildManagedPublicListUpdatePayload({
      authenticatedOwnerId: 'user-private',
      description: null,
      id: 'public-list-1',
      items: [createPublishInput().items[0]],
      slug: 'Updated Books!',
      title: 'Updated Books',
    })

    expect(payload).toEqual({
      description: null,
      items: [expect.objectContaining({ id: 'item-1', title: 'Refactoring' })],
      slug: 'updated-books',
      title: 'Updated Books',
    })
    expect(JSON.stringify(payload)).not.toContain('user-private')
  })
})

function createManagedInput(): ManagedPublicListCreateInput {
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
  }
}

function createPublishInput(): PublishPublicListInput {
  return {
    authenticatedOwnerId: 'user-private',
    owner: {
      avatarUrl: 'https://cdn.example.com/avatar.webp',
      displayName: 'ana',
      initial: 'A',
    },
    ownerNamespace: 'Ana',
    slug: 'Summer Books!',
    title: 'Summer Books',
    listDate: '2026-07-03',
    description: 'Books for the summer break.',
    items: [
      {
        id: 'item-1',
        category: 'books',
        title: 'Refactoring',
        notes: 'Public note.',
        tags: ['craft'],
        coverImageUrl: 'https://images.example.com/refactoring.jpg',
        coverProvider: 'open-library',
        coverMatchedTitle: 'Refactoring',
      },
    ],
    publishedAt: '2026-07-03T10:00:00.000Z',
  }
}

function createPocketBasePublicListRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'public-list-1',
    owner: 'user-private',
    ownerNamespace: 'ana',
    ownerDisplayName: 'ana',
    ownerAvatar: 'https://cdn.example.com/avatar.webp',
    slug: 'summer-books',
    title: 'Summer Books',
    listDate: '2026-07-03',
    description: 'Books for the summer break.',
    items: [
      {
        id: 'item-1',
        category: 'books',
        title: 'Refactoring',
        notes: 'Public note.',
        tags: ['craft'],
        coverImageUrl: 'https://images.example.com/refactoring.jpg',
        coverProvider: 'open-library',
        coverMatchedTitle: 'Refactoring',
      },
    ],
    published: true,
    publishedAt: '2026-07-03T10:00:00.000Z',
    updated: '2026-07-03T10:05:00.000Z',
    ...overrides,
  }
}
